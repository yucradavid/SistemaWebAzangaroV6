<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseScheduleRequest;
use App\Http\Requests\UpdateCourseScheduleRequest;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseSchedule;
use App\Models\Section;
use App\Models\TeacherCourseAssignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class CourseScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = CourseSchedule::query()
            ->with(['academicYear', 'section', 'course', 'teacher']);

        foreach (['academic_year_id', 'section_id', 'course_id', 'teacher_id', 'day_of_week'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('q')) {
            $query->where('room_number', 'ilike', '%' . $request->input('q') . '%');
        }

        $sort = $request->input('sort', 'day_of_week');
        $dir = strtolower($request->input('dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['day_of_week', 'start_time', 'end_time', 'created_at'];
        $perPage = max(1, min(500, (int) $request->integer('per_page', 20)));
        $useSimple = $request->boolean('simple', false);

        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'day_of_week';
        }

        $query->orderBy($sort, $dir)->orderBy('start_time', 'asc');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreCourseScheduleRequest $request)
    {
        $data = $request->validated();

        if ($message = $this->validateSchedulePayload($data)) {
            return response()->json(['message' => $message], 422);
        }

        if ($message = $this->detectConflictMessage($data)) {
            return response()->json(['message' => $message], 422);
        }

        $row = CourseSchedule::create($data);

        return response()->json([
            'message' => 'Horario creado correctamente',
            'data' => $row->load(['academicYear', 'section', 'course', 'teacher']),
        ], 201);
    }

    public function show($id)
    {
        $row = CourseSchedule::with(['academicYear', 'section', 'course', 'teacher'])->find($id);

        if (!$row) {
            return response()->json(['message' => 'Horario no encontrado'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdateCourseScheduleRequest $request, $id)
    {
        $row = CourseSchedule::find($id);

        if (!$row) {
            return response()->json(['message' => 'Horario no encontrado'], 404);
        }

        $data = $request->validated();
        $finalData = [
            'id' => $row->id,
            'academic_year_id' => $data['academic_year_id'] ?? $row->academic_year_id,
            'section_id' => $data['section_id'] ?? $row->section_id,
            'course_id' => $data['course_id'] ?? $row->course_id,
            'teacher_id' => array_key_exists('teacher_id', $data) ? $data['teacher_id'] : $row->teacher_id,
            'day_of_week' => (int) ($data['day_of_week'] ?? $row->day_of_week),
            'start_time' => $data['start_time'] ?? $row->start_time,
            'end_time' => $data['end_time'] ?? $row->end_time,
            'room_number' => array_key_exists('room_number', $data) ? $data['room_number'] : $row->room_number,
        ];

        if ($message = $this->validateSchedulePayload($finalData)) {
            return response()->json(['message' => $message], 422);
        }

        if ($message = $this->detectConflictMessage($finalData, $row->id)) {
            return response()->json(['message' => $message], 422);
        }

        $row->update($data);

        return response()->json([
            'message' => 'Horario actualizado',
            'data' => $row->load(['academicYear', 'section', 'course', 'teacher']),
        ]);
    }

    public function destroy($id)
    {
        $row = CourseSchedule::find($id);

        if (!$row) {
            return response()->json(['message' => 'Horario no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Horario eliminado']);
    }

    private function validateSchedulePayload(array $data): ?string
    {
        $section = Section::query()->find($data['section_id']);
        $course = Course::query()->find($data['course_id']);

        if (!$section || !$course) {
            return 'La seccion o el curso seleccionado ya no existe.';
        }

        if ((string) $section->academic_year_id !== (string) $data['academic_year_id']) {
            return 'La seccion seleccionada no pertenece al ano academico indicado.';
        }

        if ((string) $course->grade_level_id !== (string) $section->grade_level_id) {
            return 'El curso seleccionado no corresponde al grado de la seccion.';
        }

        if (!$this->teacherMatchesAcademicAssignment(
            $data['teacher_id'] ?? null,
            $data['course_id'],
            $data['section_id'],
            $data['academic_year_id']
        )) {
            return 'El docente seleccionado no esta asignado a ese curso o seccion para el ano academico.';
        }

        if ($message = $this->validateWeeklyCourseLoad($data)) {
            return $message;
        }

        return null;
    }

    private function detectConflictMessage(array $data, ?string $scheduleId = null): ?string
    {
        if ($this->hasSectionOverlap(
            $data['section_id'],
            (int) $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $scheduleId
        )) {
            return 'Cruce de horario: ya existe una clase en ese rango de horas para esa seccion y dia.';
        }

        if (!empty($data['teacher_id']) && $this->hasTeacherOverlap(
            $data['teacher_id'],
            (int) $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $scheduleId
        )) {
            return 'Cruce de horario: el docente ya tiene una clase asignada en ese rango de horas.';
        }

        $roomNumber = trim((string) ($data['room_number'] ?? ''));
        if ($roomNumber !== '' && $this->hasRoomOverlap(
            $data['academic_year_id'],
            $roomNumber,
            (int) $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $scheduleId
        )) {
            return 'Cruce de horario: el aula ya esta ocupada en ese rango de horas.';
        }

        return null;
    }

    private function teacherMatchesAcademicAssignment(
        ?string $teacherId,
        string $courseId,
        string $sectionId,
        string $academicYearId
    ): bool {
        if (!$teacherId) {
            return true;
        }

        $teacherAssignmentQuery = TeacherCourseAssignment::query()
            ->where('course_id', $courseId)
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true);

        if ((clone $teacherAssignmentQuery)->exists()) {
            return (clone $teacherAssignmentQuery)
                ->where('teacher_id', $teacherId)
                ->exists();
        }

        $courseAssignmentQuery = CourseAssignment::query()
            ->where('course_id', $courseId)
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId);

        if ((clone $courseAssignmentQuery)->exists()) {
            return (clone $courseAssignmentQuery)
                ->where('teacher_id', $teacherId)
                ->exists();
        }

        return true;
    }

    private function hasSectionOverlap(
        string $sectionId,
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $scheduleId
    ): bool {
        return $this->overlappingSchedulesQuery($dayOfWeek, $startTime, $endTime, $scheduleId)
            ->where('section_id', $sectionId)
            ->exists();
    }

    private function hasTeacherOverlap(
        string $teacherId,
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $scheduleId
    ): bool {
        return $this->overlappingSchedulesQuery($dayOfWeek, $startTime, $endTime, $scheduleId)
            ->where('teacher_id', $teacherId)
            ->exists();
    }

    private function hasRoomOverlap(
        string $academicYearId,
        string $roomNumber,
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $scheduleId
    ): bool {
        return $this->overlappingSchedulesQuery($dayOfWeek, $startTime, $endTime, $scheduleId)
            ->where('academic_year_id', $academicYearId)
            ->whereRaw('LOWER(room_number) = ?', [strtolower($roomNumber)])
            ->exists();
    }

    private function overlappingSchedulesQuery(
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $scheduleId
    ): Builder {
        return CourseSchedule::query()
            ->when($scheduleId, fn (Builder $query) => $query->where('id', '!=', $scheduleId))
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);
    }

    private function validateWeeklyCourseLoad(array $data): ?string
    {
        $course = Course::query()->find($data['course_id']);
        if (!$course || !$course->hours_per_week) {
            return null;
        }

        $currentScheduleId = $data['id'] ?? null;
        $existingMinutes = CourseSchedule::query()
            ->when($currentScheduleId, fn (Builder $query) => $query->where('id', '!=', $currentScheduleId))
            ->where('academic_year_id', $data['academic_year_id'])
            ->where('section_id', $data['section_id'])
            ->where('course_id', $data['course_id'])
            ->get()
            ->sum(fn (CourseSchedule $schedule) => $this->durationMinutes($schedule->start_time, $schedule->end_time));

        $newMinutes = $this->durationMinutes($data['start_time'], $data['end_time']);
        $projectedMinutes = $existingMinutes + $newMinutes;
        $maximumMinutes = ((int) $course->hours_per_week) * 60;

        if ($projectedMinutes > $maximumMinutes) {
            $projectedHours = number_format($projectedMinutes / 60, 2, '.', '');
            $maximumHours = number_format($maximumMinutes / 60, 2, '.', '');

            return "La carga semanal del curso excede el limite configurado ({$projectedHours}h de {$maximumHours}h).";
        }

        return null;
    }

    private function durationMinutes(string $startTime, string $endTime): int
    {
        [$startHour, $startMinute] = array_map('intval', explode(':', $startTime));
        [$endHour, $endMinute] = array_map('intval', explode(':', $endTime));

        return max(0, (($endHour * 60) + $endMinute) - (($startHour * 60) + $startMinute));
    }
}
