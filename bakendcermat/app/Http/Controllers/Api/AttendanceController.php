<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Models\Attendance;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function myContext(Request $request): JsonResponse
    {
        $role = $request->user()?->profile?->role;
        $teacher = null;
        $teacherId = null;

        if ($role === 'teacher') {
            $teacher = Teacher::query()
                ->where('user_id', (string) $request->user()->id)
                ->first();

            if (!$teacher) {
                return response()->json([
                    'teacher' => null,
                    'assignments' => [],
                    'message' => 'No se encontró el docente asociado al usuario autenticado.',
                ]);
            }

            $teacherId = (string) $teacher->id;
        }

        $assignments = TeacherCourseAssignment::query()
            ->with(['teacher', 'course', 'section.gradeLevel', 'academicYear'])
            ->when($teacherId, fn (Builder $query) => $query->where('teacher_id', $teacherId))
            ->where('is_active', true)
            ->orderByDesc('assigned_at')
            ->orderByDesc('created_at')
            ->get()
            ->values();

        return response()->json([
            'teacher' => $teacher,
            'assignments' => $assignments,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Attendance::query()
            ->with([
                'student',
                'course',
                'section.gradeLevel',
                'justifications.guardian',
            ]);

        $this->applyTeacherScope($query, $request);

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = (int) $request->integer('per_page', 30);

        return response()->json(
            $query->orderByDesc('date')
                ->orderByDesc('updated_at')
                ->paginate($perPage)
        );
    }

    public function adminOverview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date',
            'course_id' => 'nullable|uuid|exists:courses,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'teacher_id' => 'nullable|uuid|exists:teachers,id',
        ]);

        $date = $validated['date'] ?? now()->toDateString();

        $assignments = TeacherCourseAssignment::query()
            ->with(['teacher', 'course', 'section.gradeLevel', 'academicYear'])
            ->where('is_active', true)
            ->when(
                !empty($validated['course_id']),
                fn (Builder $query) => $query->where('course_id', $validated['course_id'])
            )
            ->when(
                !empty($validated['section_id']),
                fn (Builder $query) => $query->where('section_id', $validated['section_id'])
            )
            ->when(
                !empty($validated['teacher_id']),
                fn (Builder $query) => $query->where('teacher_id', $validated['teacher_id'])
            )
            ->orderByDesc('assigned_at')
            ->orderByDesc('created_at')
            ->get();

        $studentCounts = DB::table('student_course_enrollments')
            ->selectRaw('course_id, section_id, academic_year_id, count(*) as student_count')
            ->where('status', 'active')
            ->whereIn('course_id', $assignments->pluck('course_id')->filter()->unique()->values())
            ->whereIn('section_id', $assignments->pluck('section_id')->filter()->unique()->values())
            ->groupBy('course_id', 'section_id', 'academic_year_id')
            ->get()
            ->keyBy(fn ($row) => $this->buildAssignmentKey($row->course_id, $row->section_id, $row->academic_year_id));

        $attendanceTotals = DB::table('attendance')
            ->selectRaw("
                course_id,
                section_id,
                count(*) as recorded_count,
                sum(case when status = 'presente' then 1 else 0 end) as present_count,
                sum(case when status = 'tarde' then 1 else 0 end) as late_count,
                sum(case when status = 'falta' then 1 else 0 end) as absent_count,
                sum(case when status = 'justificado' then 1 else 0 end) as justified_count,
                max(updated_at) as last_recorded_at
            ")
            ->whereDate('date', $date)
            ->when(
                !empty($validated['course_id']),
                fn ($query) => $query->where('course_id', $validated['course_id'])
            )
            ->when(
                !empty($validated['section_id']),
                fn ($query) => $query->where('section_id', $validated['section_id'])
            )
            ->groupBy('course_id', 'section_id')
            ->get()
            ->keyBy(fn ($row) => $this->buildAssignmentKey($row->course_id, $row->section_id));

        $pendingJustifications = DB::table('attendance_justifications as aj')
            ->join('attendance as a', 'a.id', '=', 'aj.attendance_id')
            ->selectRaw('a.course_id, a.section_id, count(*) as pending_count')
            ->whereDate('a.date', $date)
            ->where('aj.status', 'pendiente')
            ->when(
                !empty($validated['course_id']),
                fn ($query) => $query->where('a.course_id', $validated['course_id'])
            )
            ->when(
                !empty($validated['section_id']),
                fn ($query) => $query->where('a.section_id', $validated['section_id'])
            )
            ->groupBy('a.course_id', 'a.section_id')
            ->get()
            ->keyBy(fn ($row) => $this->buildAssignmentKey($row->course_id, $row->section_id));

        $assignmentSummaries = $assignments->map(function (TeacherCourseAssignment $assignment) use ($studentCounts, $attendanceTotals, $pendingJustifications) {
            $studentRow = $studentCounts->get(
                $this->buildAssignmentKey($assignment->course_id, $assignment->section_id, $assignment->academic_year_id)
            );
            $attendanceRow = $attendanceTotals->get(
                $this->buildAssignmentKey($assignment->course_id, $assignment->section_id)
            );
            $pendingRow = $pendingJustifications->get(
                $this->buildAssignmentKey($assignment->course_id, $assignment->section_id)
            );

            $studentCount = (int) ($studentRow->student_count ?? 0);
            $recordedCount = (int) ($attendanceRow->recorded_count ?? 0);

            return [
                'assignment_id' => $assignment->id,
                'teacher_id' => $assignment->teacher_id,
                'teacher' => $assignment->teacher,
                'course_id' => $assignment->course_id,
                'course' => $assignment->course,
                'section_id' => $assignment->section_id,
                'section' => $assignment->section,
                'academic_year_id' => $assignment->academic_year_id,
                'academic_year' => $assignment->academicYear,
                'student_count' => $studentCount,
                'recorded_count' => $recordedCount,
                'present_count' => (int) ($attendanceRow->present_count ?? 0),
                'late_count' => (int) ($attendanceRow->late_count ?? 0),
                'absent_count' => (int) ($attendanceRow->absent_count ?? 0),
                'justified_count' => (int) ($attendanceRow->justified_count ?? 0),
                'pending_justifications_count' => (int) ($pendingRow->pending_count ?? 0),
                'is_registered' => $recordedCount > 0,
                'completion_rate' => $studentCount > 0
                    ? round(($recordedCount / $studentCount) * 100, 1)
                    : 0,
                'last_recorded_at' => $attendanceRow->last_recorded_at ?? null,
            ];
        })->values();

        $teacherSummaries = $assignmentSummaries
            ->groupBy('teacher_id')
            ->map(function ($rows) {
                $first = $rows->first();
                $pendingAssignments = $rows->where('is_registered', false)->values();

                return [
                    'teacher_id' => $first['teacher_id'],
                    'teacher' => $first['teacher'],
                    'total_assignments' => $rows->count(),
                    'registered_assignments' => $rows->where('is_registered', true)->count(),
                    'pending_assignments' => $pendingAssignments->count(),
                    'is_complete' => $pendingAssignments->isEmpty(),
                    'pending_details' => $pendingAssignments->map(fn ($row) => [
                        'assignment_id' => $row['assignment_id'],
                        'course' => $row['course'],
                        'section' => $row['section'],
                        'student_count' => $row['student_count'],
                    ])->values(),
                ];
            })
            ->sortByDesc('pending_assignments')
            ->values();

        return response()->json([
            'date' => $date,
            'summary' => [
                'assignments_total' => $assignmentSummaries->count(),
                'assignments_registered' => $assignmentSummaries->where('is_registered', true)->count(),
                'assignments_pending' => $assignmentSummaries->where('is_registered', false)->count(),
                'students_expected' => $assignmentSummaries->sum('student_count'),
                'records_captured' => $assignmentSummaries->sum('recorded_count'),
                'present_count' => $assignmentSummaries->sum('present_count'),
                'late_count' => $assignmentSummaries->sum('late_count'),
                'absent_count' => $assignmentSummaries->sum('absent_count'),
                'justified_count' => $assignmentSummaries->sum('justified_count'),
                'pending_justifications_count' => $assignmentSummaries->sum('pending_justifications_count'),
                'coverage_rate' => $assignmentSummaries->sum('student_count') > 0
                    ? round(($assignmentSummaries->sum('recorded_count') / $assignmentSummaries->sum('student_count')) * 100, 1)
                    : 0,
            ],
            'teacher_statuses' => $teacherSummaries,
            'assignment_statuses' => $assignmentSummaries,
        ]);
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $data = $request->validated();

        $this->ensureTeacherCanManageAttendance($request, $data['course_id'], $data['section_id']);
        $this->validateJustificationRequirement($data['status'], $data['justification'] ?? null);

        $existingAttendance = Attendance::query()
            ->where('student_id', $data['student_id'])
            ->where('course_id', $data['course_id'])
            ->whereDate('date', $data['date'])
            ->first();

        $this->preventApprovedJustificationOverride($existingAttendance, $data['status']);

        $recorderId = $this->resolveRecorderId($request);
        if ($recorderId) {
            $data['recorded_by'] = $recorderId;
        }

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'course_id'  => $data['course_id'],
                'date'       => $data['date'],
            ],
            $data
        );

        return response()->json(
            $attendance->fresh()->load(['student', 'course', 'section.gradeLevel', 'justifications.guardian']),
            201
        );
    }

    public function batchStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date'       => 'required|date',
            'course_id'  => 'required|uuid|exists:courses,id',
            'section_id' => 'required|uuid|exists:sections,id',
            'records'    => 'required|array|min:1',
            'records.*.student_id'    => 'required|uuid|exists:students,id',
            'records.*.status'        => 'required|string|in:presente,tarde,falta,justificado',
            'records.*.justification' => 'nullable|string|max:1000',
        ]);

        $this->ensureTeacherCanManageAttendance($request, $validated['course_id'], $validated['section_id']);

        $recordedBy = $this->resolveRecorderId($request);
        $processedCount = 0;

        DB::transaction(function () use ($validated, $recordedBy, &$processedCount) {
            foreach ($validated['records'] as $record) {
                $this->validateJustificationRequirement($record['status'], $record['justification'] ?? null);

                $existingAttendance = Attendance::query()
                    ->where('student_id', $record['student_id'])
                    ->where('course_id', $validated['course_id'])
                    ->whereDate('date', $validated['date'])
                    ->first();

                $this->preventApprovedJustificationOverride($existingAttendance, $record['status']);

                Attendance::updateOrCreate(
                    [
                        'student_id' => $record['student_id'],
                        'course_id'  => $validated['course_id'],
                        'date'       => $validated['date'],
                    ],
                    [
                        'section_id'    => $validated['section_id'],
                        'status'        => $record['status'],
                        'justification' => $record['justification'] ?? null,
                        'recorded_by'   => $recordedBy,
                    ]
                );

                $processedCount++;
            }
        });

        return response()->json([
            'message' => "Se procesaron {$processedCount} registros de asistencia.",
            'count' => $processedCount,
        ]);
    }

    public function show(Request $request, Attendance $attendance): JsonResponse
    {
        $this->ensureTeacherOwnsAttendance($request, $attendance);

        return response()->json(
            $attendance->load(['student', 'course', 'section.gradeLevel', 'justifications.guardian'])
        );
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $this->ensureTeacherOwnsAttendance($request, $attendance);

        $data = $request->validated();
        $nextStatus = $data['status'] ?? (string) $attendance->status;
        $nextJustification = array_key_exists('justification', $data)
            ? $data['justification']
            : $attendance->justification;

        $this->validateJustificationRequirement($nextStatus, $nextJustification);
        $this->preventApprovedJustificationOverride($attendance, $nextStatus);

        $recorderId = $this->resolveRecorderId($request);
        if ($recorderId) {
            $data['recorded_by'] = $recorderId;
        }

        $attendance->update($data);

        return response()->json(
            $attendance->fresh()->load(['student', 'course', 'section.gradeLevel', 'justifications.guardian'])
        );
    }

    public function destroy(Request $request, Attendance $attendance): JsonResponse
    {
        $this->ensureTeacherOwnsAttendance($request, $attendance);
        $attendance->delete();

        return response()->json(['message' => 'Registro de asistencia eliminado.']);
    }

    private function applyTeacherScope(Builder $query, Request $request): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->whereExists(function ($subQuery) use ($teacherId, $request) {
            $subQuery->select(DB::raw(1))
                ->from('teacher_course_assignments as tca')
                ->whereColumn('tca.course_id', 'attendance.course_id')
                ->whereColumn('tca.section_id', 'attendance.section_id')
                ->where('tca.teacher_id', $teacherId);

            if (!$request->boolean('history_scope', false)) {
                $subQuery->where('tca.is_active', true);
            }
        });
    }

    private function ensureTeacherCanManageAttendance(Request $request, string $courseId, string $sectionId): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontró el docente asociado al usuario autenticado.',
            ]);
        }

        $isAssigned = TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('course_id', $courseId)
            ->where('section_id', $sectionId)
            ->where('is_active', true)
            ->exists();

        if (!$isAssigned) {
            throw ValidationException::withMessages([
                'assignment' => 'No tienes una asignación activa para registrar asistencia en este curso y sección.',
            ]);
        }
    }

    private function ensureTeacherOwnsAttendance(Request $request, Attendance $attendance): void
    {
        $this->ensureTeacherCanManageAttendance($request, (string) $attendance->course_id, (string) $attendance->section_id);
    }

    private function resolveTeacherId(Request $request): ?string
    {
        return Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }

    private function resolveRecorderId(Request $request): ?string
    {
        $authUser = $request->user();

        if (!$authUser) {
            return null;
        }

        $emailCandidates = array_values(array_filter([
            $authUser->email ?? null,
            $authUser->profile?->email ?? null,
        ]));

        foreach ($emailCandidates as $email) {
            $authSchemaUserId = DB::table('auth.users')
                ->whereRaw('lower(email) = ?', [strtolower((string) $email)])
                ->value('id');

            if ($authSchemaUserId) {
                return (string) $authSchemaUserId;
            }
        }

        $candidateIds = array_values(array_filter([
            $authUser->id ?? null,
            $authUser->user_id ?? null,
            $authUser->profile?->user_id ?? null,
        ]));

        foreach ($candidateIds as $candidateId) {
            $candidateId = (string) $candidateId;

            if (DB::table('auth.users')->where('id', $candidateId)->exists()) {
                return $candidateId;
            }
        }

        return null;
    }

    private function validateJustificationRequirement(string $status, ?string $justification): void
    {
        if (in_array($status, ['falta', 'justificado'], true) && blank($justification)) {
            throw ValidationException::withMessages([
                'justification' => 'Debes registrar un comentario cuando el estado es falta o justificado.',
            ]);
        }
    }

    private function preventApprovedJustificationOverride(?Attendance $attendance, string $incomingStatus): void
    {
        if (!$attendance) {
            return;
        }

        $hasApprovedJustification = DB::table('attendance_justifications')
            ->where('attendance_id', $attendance->id)
            ->where('status', 'aprobada')
            ->exists();

        if ($hasApprovedJustification && $incomingStatus !== 'justificado') {
            throw ValidationException::withMessages([
                'status' => 'Este registro tiene una justificación aprobada y debe permanecer como justificado.',
            ]);
        }
    }
    private function buildAssignmentKey(?string $courseId, ?string $sectionId, ?string $academicYearId = null): string
    {
        return implode('|', [
            (string) $courseId,
            (string) $sectionId,
            (string) ($academicYearId ?? ''),
        ]);
    }
}
