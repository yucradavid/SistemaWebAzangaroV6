<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherCourseAssignments\StoreTeacherCourseAssignmentRequest;
use App\Http\Requests\TeacherCourseAssignments\UpdateTeacherCourseAssignmentRequest;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Section;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Models\Profile;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class TeacherCourseAssignmentController extends Controller
{
    private const DAY_NAMES = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
        7 => 'Domingo',
    ];

    // GET /api/teacher-course-assignments
    public function index(Request $request)
    {
        $q = TeacherCourseAssignment::query()
            ->with(['teacher', 'course', 'section', 'academicYear', 'assignedByProfile']);

        $teacherId = $this->resolveAuthenticatedTeacherId($request);

        if ($request->user()?->profile?->role === 'teacher') {
            if (!$teacherId) {
                return response()->json([
                    'data' => [],
                    'message' => 'No se encontró el docente asociado al usuario autenticado.',
                ], 200);
            }

            $q->where('teacher_id', $teacherId);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->string('academic_year_id'));
        }
        if ($request->filled('section_id')) {
            $q->where('section_id', $request->string('section_id'));
        }
        if ($request->filled('teacher_id')) {
            $q->where('teacher_id', $request->string('teacher_id'));
        }
        if ($request->filled('course_id')) {
            $q->where('course_id', $request->string('course_id'));
        }
        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->integer('per_page', 15);
        $useSimple = $request->boolean('simple', false);

        $query = $q->orderByDesc('created_at');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    // POST /api/teacher-course-assignments
    public function store(StoreTeacherCourseAssignmentRequest $request)
    {
        $data = $request->validated();
        unset($data['unique_combo']);

        // asignado por el usuario autenticado
        $user = $request->user();
        $profileId = Profile::where('user_id', $user->id)->value('id');

        if (!$profileId) {
            return response()->json(['message' => 'El usuario no tiene profile asociado.'], 422);
        }

        $data['assigned_by'] = $profileId;

        // si no mandan assigned_at, se queda null y la BD pone default si tiene
        try {
            $assignment = TeacherCourseAssignment::create($data);
        } catch (QueryException $e) {
            if (preg_match('/LIMITE_CURSOS_DOCENTE:(\d+):(\d+)/', $e->getMessage(), $matches)) {
                return response()->json([
                    'error_code' => 'TEACHER_COURSE_LIMIT',
                    'current' => (int) $matches[1],
                    'max' => (int) $matches[2],
                    'message' => 'El docente ya tiene el máximo de cursos asignados.',
                ], 422);
            }

            if (preg_match('/SECCION_ANIO_INCONSISTENTE:([0-9a-fA-F-]+):([0-9a-fA-F-]+)/', $e->getMessage(), $matches)) {
                return response()->json([
                    'error_code' => 'SECTION_YEAR_MISMATCH',
                    'section_id' => $matches[1],
                    'academic_year_id' => $matches[2],
                    'message' => 'La sección seleccionada no pertenece al año académico indicado.',
                ], 422);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Asignación creada',
            'data' => $assignment->load(['teacher', 'course', 'section', 'academicYear', 'assignedByProfile'])
        ], 201);
    }

    // POST /api/teacher-course-assignments/check-schedule-conflict
    public function checkScheduleConflict(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => ['required', 'uuid', 'exists:teachers,id'],
            'section_id' => ['required', 'uuid', 'exists:sections,id'],
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
        ]);

        $newSchedules = CourseSchedule::query()
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('section_id', $data['section_id'])
            ->where('course_id', $data['course_id'])
            ->get();

        if ($newSchedules->isEmpty()) {
            return response()->json([
                'has_conflict' => false,
                'conflicting_with' => [],
                'suggestions' => [],
            ]);
        }

        $teacherSchedules = CourseSchedule::query()
            ->with(['course', 'section'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('teacher_id', $data['teacher_id'])
            ->where(function ($q) use ($data) {
                $q->where('section_id', '!=', $data['section_id'])
                    ->orWhere('course_id', '!=', $data['course_id']);
            })
            ->get();

        $conflicts = [];
        foreach ($newSchedules as $newSchedule) {
            foreach ($teacherSchedules as $existing) {
                if ($this->schedulesOverlap($newSchedule, $existing)) {
                    $conflicts[] = [
                        'course_name' => $existing->course?->name,
                        'section_name' => $this->sectionDisplayName($existing->section),
                        'day' => self::DAY_NAMES[$existing->day_of_week] ?? (string) $existing->day_of_week,
                        'time' => substr($existing->start_time, 0, 5) . '-' . substr($existing->end_time, 0, 5),
                    ];
                }
            }
        }

        if (empty($conflicts)) {
            return response()->json([
                'has_conflict' => false,
                'conflicting_with' => [],
                'suggestions' => [],
            ]);
        }

        $suggestions = $this->findAlternativeSections($data, $newSchedules, $teacherSchedules);

        return response()->json([
            'has_conflict' => true,
            'conflicting_with' => $conflicts,
            'suggestions' => $suggestions,
        ]);
    }

    // GET /api/teacher-course-assignments/by-course-section
    public function byCourseSection(Request $request)
    {
        $data = $request->validate([
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
            'section_id' => ['required', 'uuid', 'exists:sections,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
        ]);

        $assignedTeachers = TeacherCourseAssignment::query()
            ->with('teacher')
            ->where('course_id', $data['course_id'])
            ->where('section_id', $data['section_id'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('is_active', true)
            ->get()
            ->map(fn (TeacherCourseAssignment $a) => [
                'teacher_id' => $a->teacher_id,
                'teacher_name' => trim(($a->teacher?->first_name ?? '') . ' ' . ($a->teacher?->last_name ?? '')),
                'assigned_at' => $a->assigned_at ?? $a->created_at,
            ])
            ->values();

        return response()->json(['assigned_teachers' => $assignedTeachers]);
    }

    private function schedulesOverlap(CourseSchedule $a, CourseSchedule $b): bool
    {
        return $a->day_of_week === $b->day_of_week
            && $a->start_time < $b->end_time
            && $a->end_time > $b->start_time;
    }

    private function sectionDisplayName(?Section $section): ?string
    {
        if (!$section) {
            return null;
        }

        return $section->gradeLevel?->name
            ? $section->gradeLevel->name . ' - Sección ' . $section->section_letter
            : 'Sección ' . $section->section_letter;
    }

    /**
     * Busca otras secciones del mismo curso (mismo grado) donde el horario
     * no choque con la carga actual del docente.
     */
    private function findAlternativeSections(array $data, $newSchedules, $teacherSchedules): array
    {
        $targetSection = Section::query()->find($data['section_id']);
        if (!$targetSection) {
            return [];
        }

        $candidateSectionIds = Section::query()
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('grade_level_id', $targetSection->grade_level_id)
            ->where('id', '!=', $targetSection->id)
            ->pluck('id');

        if ($candidateSectionIds->isEmpty()) {
            return [];
        }

        $candidateSchedules = CourseSchedule::query()
            ->with('section.gradeLevel')
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('course_id', $data['course_id'])
            ->whereIn('section_id', $candidateSectionIds)
            ->get()
            ->groupBy('section_id');

        $suggestions = [];
        foreach ($candidateSchedules as $sectionId => $schedules) {
            $hasConflict = false;
            foreach ($schedules as $schedule) {
                foreach ($teacherSchedules as $existing) {
                    if ($this->schedulesOverlap($schedule, $existing)) {
                        $hasConflict = true;
                        break 2;
                    }
                }
            }

            if (!$hasConflict) {
                $first = $schedules->first();
                $suggestions[] = [
                    'section_id' => $sectionId,
                    'section_name' => $this->sectionDisplayName($first->section),
                    'day' => self::DAY_NAMES[$first->day_of_week] ?? (string) $first->day_of_week,
                    'time' => substr($first->start_time, 0, 5) . '-' . substr($first->end_time, 0, 5),
                    'available' => true,
                ];
            }
        }

        return $suggestions;
    }

    // GET /api/teacher-course-assignments/{id}
    public function show(string $id)
    {
        $assignment = TeacherCourseAssignment::with(['teacher', 'course', 'section', 'academicYear', 'assignedByProfile'])
            ->findOrFail($id);

        $teacherId = $this->resolveAuthenticatedTeacherId(request());

        if (request()->user()?->profile?->role === 'teacher' && (string) $assignment->teacher_id !== $teacherId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($assignment);
    }

    // PUT/PATCH /api/teacher-course-assignments/{id}
    public function update(UpdateTeacherCourseAssignmentRequest $request, string $id)
    {
        $assignment = TeacherCourseAssignment::findOrFail($id);

        $data = $request->validated();
        unset($data['unique_combo']);

        // por seguridad: no permitir que el cliente cambie assigned_by
        unset($data['assigned_by']);

        $assignment->update($data);

        return response()->json([
            'message' => 'Asignación actualizada',
            'data' => $assignment->load(['teacher', 'course', 'section', 'academicYear', 'assignedByProfile'])
        ]);
    }

    // DELETE /api/teacher-course-assignments/{id}
    public function destroy(string $id)
    {
        $assignment = TeacherCourseAssignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'message' => 'Asignación eliminada'
        ]);
    }

    private function resolveAuthenticatedTeacherId(Request $request): ?string
    {
        return Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }
}
