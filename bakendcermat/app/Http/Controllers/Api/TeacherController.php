<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Profile;
use App\Models\SystemSetting;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::query();
        $role = $request->user()?->profile?->role;

        if ($role === 'teacher') {
            $query->where('user_id', (string) $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('dni')) {
            $query->where('dni', $request->dni);
        }

        if ($request->has('teacher_code')) {
            $query->where('teacher_code', $request->teacher_code);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('first_name', 'ilike', "%{$q}%")
                    ->orWhere('last_name', 'ilike', "%{$q}%")
                    ->orWhere('teacher_code', 'ilike', "%{$q}%")
                    ->orWhere('specialization', 'ilike', "%{$q}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $query = $query->orderBy('last_name')
            ->orderBy('first_name');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreTeacherRequest $request)
    {
        $row = Teacher::create($request->validated());

        return response()->json([
            'message' => 'Docente creado',
            'data' => $row
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        if ($request->user()?->profile?->role === 'teacher' && (string) $row->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($row);
    }

    public function update(UpdateTeacherRequest $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Docente actualizado',
            'data' => $row
        ]);
    }

    public function destroy($id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Docente eliminado']);
    }

    // PUT /api/teachers/{teacher}/max-courses-override
    public function updateMaxCoursesOverride(Request $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $data = $request->validate([
            'max_courses_override' => ['nullable', 'integer', 'min:1'],
        ], [
            'max_courses_override.min' => 'El limite de cursos debe ser mayor a 0.',
        ]);

        $requestedLimit = $data['max_courses_override'] ?? $this->globalMaxCoursesPerTeacher();
        $activeYearId = AcademicYear::query()->where('is_active', true)->value('id');
        $currentDistinctCourses = $this->distinctActiveCourseCount($row->id, $activeYearId);

        if ($requestedLimit < $currentDistinctCourses) {
            return response()->json([
                'error_code' => 'EXCEEDS_NEW_LIMIT',
                'current_count' => $currentDistinctCourses,
                'requested_limit' => $requestedLimit,
                'courses_to_review' => $this->coursesToReview($row->id, $activeYearId),
            ], 409);
        }

        $row->update(['max_courses_override' => $data['max_courses_override'] ?? null]);

        return response()->json([
            'message' => $data['max_courses_override'] === null
                ? 'El docente vuelve a usar el limite global.'
                : 'Limite individual actualizado para el docente.',
            'data' => $row,
        ]);
    }

    // POST /api/teachers/{teacher}/max-courses-override/confirm
    public function confirmMaxCoursesOverride(Request $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $data = $request->validate([
            'max_courses_override' => ['nullable', 'integer', 'min:1'],
            'remove_course_ids' => ['sometimes', 'array'],
            'remove_course_ids.*' => ['uuid', 'exists:courses,id'],
            'reassignments' => ['sometimes', 'array'],
            'reassignments.*.assignment_id' => ['required', 'uuid', 'exists:teacher_course_assignments,id'],
            'reassignments.*.new_teacher_id' => ['required', 'uuid', 'exists:teachers,id'],
        ]);

        $removeCourseIds = $data['remove_course_ids'] ?? [];
        $reassignments = $data['reassignments'] ?? [];

        $profileId = Profile::where('user_id', $request->user()->id)->value('id');
        if (!$profileId) {
            return response()->json(['message' => 'El usuario no tiene profile asociado.'], 422);
        }

        try {
            DB::transaction(function () use ($row, $removeCourseIds, $reassignments, $profileId) {
                foreach ($removeCourseIds as $courseId) {
                    TeacherCourseAssignment::where('teacher_id', $row->id)
                        ->where('course_id', $courseId)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);
                }

                foreach ($reassignments as $r) {
                    $original = TeacherCourseAssignment::where('id', $r['assignment_id'])
                        ->where('teacher_id', $row->id)
                        ->where('is_active', true)
                        ->first();

                    if (!$original) {
                        continue;
                    }

                    $existing = TeacherCourseAssignment::where('teacher_id', $r['new_teacher_id'])
                        ->where('section_id', $original->section_id)
                        ->where('course_id', $original->course_id)
                        ->where('academic_year_id', $original->academic_year_id)
                        ->first();

                    if ($existing) {
                        $existing->update(['is_active' => true, 'assigned_by' => $profileId]);
                    } else {
                        TeacherCourseAssignment::create([
                            'teacher_id' => $r['new_teacher_id'],
                            'course_id' => $original->course_id,
                            'section_id' => $original->section_id,
                            'academic_year_id' => $original->academic_year_id,
                            'is_active' => true,
                            'assigned_by' => $profileId,
                        ]);
                    }

                    $original->update(['is_active' => false]);
                }
            });
        } catch (QueryException $e) {
            if (preg_match('/LIMITE_CURSOS_DOCENTE:(\d+):(\d+)/', $e->getMessage(), $matches)) {
                return response()->json([
                    'error_code' => 'TEACHER_COURSE_LIMIT',
                    'current' => (int) $matches[1],
                    'max' => (int) $matches[2],
                    'message' => 'El docente al que quieres reasignar ya alcanzo su propio limite de cursos.',
                ], 422);
            }

            throw $e;
        }

        // Verificacion final server-side: los cambios deben dejar al docente dentro del nuevo limite.
        $activeYearId = AcademicYear::query()->where('is_active', true)->value('id');
        $finalCount = $this->distinctActiveCourseCount($row->id, $activeYearId);
        $newLimit = $data['max_courses_override'] ?? $this->globalMaxCoursesPerTeacher();

        if ($finalCount > $newLimit) {
            return response()->json([
                'error_code' => 'EXCEEDS_NEW_LIMIT',
                'current_count' => $finalCount,
                'requested_limit' => $newLimit,
                'courses_to_review' => $this->coursesToReview($row->id, $activeYearId),
                'message' => 'Los cambios elegidos no son suficientes para cumplir el nuevo limite.',
            ], 409);
        }

        $row->update(['max_courses_override' => $data['max_courses_override'] ?? null]);

        return response()->json([
            'message' => 'Cursos ajustados y limite actualizado.',
            'data' => $row,
        ]);
    }

    private function globalMaxCoursesPerTeacher(): int
    {
        return (int) (SystemSetting::query()->where('key', 'max_courses_per_teacher')->value('value') ?? 6);
    }

    private function distinctActiveCourseCount(string $teacherId, ?string $academicYearId): int
    {
        return TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->distinct('course_id')
            ->count('course_id');
    }

    private function coursesToReview(string $teacherId, ?string $academicYearId)
    {
        return TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->with(['course', 'section.gradeLevel'])
            ->get()
            ->groupBy('course_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'course_id' => $first->course_id,
                    'course_name' => $first->course->name,
                    'course_code' => $first->course->code,
                    'assignment_ids' => $group->pluck('id'),
                    'sections' => $group->map(fn ($a) => [
                        'assignment_id' => $a->id,
                        'section_name' => $a->section->name,
                        'grade_name' => $a->section->gradeLevel->name,
                    ])->values(),
                ];
            })->values();
    }
}
