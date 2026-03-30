<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceDailyRecord;
use App\Models\AttendanceQrSession;
use App\Models\StudentCourseEnrollment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DailyAttendanceService
{
    public function getSectionDailyAttendance(string $sectionId, string $academicYearId, string $date): array
    {
        $studentRows = StudentCourseEnrollment::query()
            ->with(['student', 'course'])
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->get();

        $students = $studentRows
            ->map(fn (StudentCourseEnrollment $enrollment) => $enrollment->student)
            ->filter()
            ->unique('id')
            ->sortBy(fn ($student) => trim(($student->last_name ?? '') . ' ' . ($student->first_name ?? '')))
            ->values();

        $dailyRecords = AttendanceDailyRecord::query()
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        $scheduledCourses = $this->resolveScheduledCourses($sectionId, $academicYearId, $date);
        $qrSessions = AttendanceQrSession::query()
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->whereDate('date', $date)
            ->orderByDesc('created_at')
            ->get();

        $rows = $students->map(function ($student) use ($dailyRecords) {
            /** @var AttendanceDailyRecord|null $dailyRecord */
            $dailyRecord = $dailyRecords->get($student->id);

            return [
                'student_id' => (string) $student->id,
                'student' => $student,
                'entry_status' => $dailyRecord?->entry_status,
                'entry_note' => $dailyRecord?->entry_note,
                'entry_marked_at' => optional($dailyRecord?->entry_marked_at)?->toIso8601String(),
                'entry_source' => $dailyRecord?->entry_source,
                'exit_status' => $dailyRecord?->exit_status,
                'exit_note' => $dailyRecord?->exit_note,
                'exit_marked_at' => optional($dailyRecord?->exit_marked_at)?->toIso8601String(),
                'exit_source' => $dailyRecord?->exit_source,
                'effective_status' => $dailyRecord?->entry_status,
            ];
        })->values();

        return [
            'date' => $date,
            'section_id' => $sectionId,
            'academic_year_id' => $academicYearId,
            'summary' => [
                'students_total' => $rows->count(),
                'entry_present_count' => $rows->where('entry_status', 'presente')->count(),
                'entry_late_count' => $rows->where('entry_status', 'tarde')->count(),
                'entry_absent_count' => $rows->where('entry_status', 'falta')->count(),
                'entry_justified_count' => $rows->where('entry_status', 'justificado')->count(),
                'exit_recorded_count' => $rows->filter(fn (array $row) => !empty($row['exit_status']))->count(),
            ],
            'students' => $rows,
            'scheduled_courses' => $scheduledCourses['courses'],
            'uses_schedule' => $scheduledCourses['uses_schedule'],
            'qr_sessions' => $qrSessions,
        ];
    }

    public function storeSectionCheckpoint(
        string $sectionId,
        string $academicYearId,
        string $date,
        string $checkpoint,
        array $records,
        ?string $profileId,
        string $source = 'manual'
    ): array {
        $processedStudents = [];
        $skippedStudents = [];
        $propagatedRecords = 0;

        DB::transaction(function () use (
            $sectionId,
            $academicYearId,
            $date,
            $checkpoint,
            $records,
            $profileId,
            $source,
            &$processedStudents,
            &$skippedStudents,
            &$propagatedRecords
        ) {
            foreach ($records as $record) {
                $studentId = (string) $record['student_id'];
                $status = (string) $record['status'];
                $note = $record['note'] ?? null;

                $courseIds = $checkpoint === 'entrada'
                    ? $this->resolveStudentCourseIdsForDate($studentId, $sectionId, $academicYearId, $date)
                    : [];

                if (
                    $checkpoint === 'entrada'
                    && $status !== 'justificado'
                    && $this->hasApprovedJustificationConflict($studentId, $courseIds, $date)
                ) {
                    $skippedStudents[] = [
                        'student_id' => $studentId,
                        'reason' => 'El estudiante tiene una justificacion aprobada en uno de los cursos del dia.',
                    ];
                    continue;
                }

                /** @var AttendanceDailyRecord $dailyRecord */
                $dailyRecord = AttendanceDailyRecord::query()->firstOrNew([
                    'student_id' => $studentId,
                    'section_id' => $sectionId,
                    'academic_year_id' => $academicYearId,
                    'date' => $date,
                ]);

                if ($checkpoint === 'entrada') {
                    $dailyRecord->entry_status = $status;
                    $dailyRecord->entry_note = $note;
                    $dailyRecord->entry_marked_at = now();
                    $dailyRecord->entry_source = $source;
                } else {
                    $dailyRecord->exit_status = $status;
                    $dailyRecord->exit_note = $note;
                    $dailyRecord->exit_marked_at = now();
                    $dailyRecord->exit_source = $source;
                }

                $dailyRecord->last_recorded_by_profile_id = $profileId;
                $dailyRecord->save();

                if ($checkpoint === 'entrada') {
                    foreach ($courseIds as $courseId) {
                        Attendance::query()->updateOrCreate(
                            [
                                'student_id' => $studentId,
                                'course_id' => $courseId,
                                'date' => $date,
                            ],
                            [
                                'section_id' => $sectionId,
                                'status' => $status,
                                'justification' => $note,
                                'recorded_by' => null,
                            ]
                        );

                        $propagatedRecords++;
                    }
                }

                $processedStudents[] = $studentId;
            }
        });

        return [
            'processed_count' => count($processedStudents),
            'skipped_count' => count($skippedStudents),
            'propagated_records_count' => $propagatedRecords,
            'skipped_students' => $skippedStudents,
        ];
    }

    public function createQrSession(
        string $sectionId,
        string $academicYearId,
        string $date,
        string $checkpoint,
        int $expiresInMinutes,
        int $lateAfterMinutes,
        ?string $profileId,
        ?string $notes = null
    ): AttendanceQrSession {
        AttendanceQrSession::query()
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->whereDate('date', $date)
            ->where('checkpoint_type', $checkpoint)
            ->where('status', 'activo')
            ->update([
                'status' => 'cerrado',
                'closed_at' => now(),
                'updated_at' => now(),
            ]);

        return AttendanceQrSession::query()->create([
            'section_id' => $sectionId,
            'academic_year_id' => $academicYearId,
            'date' => $date,
            'checkpoint_type' => $checkpoint,
            'session_code' => $this->generateUniqueSessionCode(),
            'token' => Str::random(64),
            'status' => 'activo',
            'late_after_minutes' => $lateAfterMinutes,
            'opened_at' => now(),
            'expires_at' => now()->addMinutes($expiresInMinutes),
            'created_by_profile_id' => $profileId,
            'notes' => $notes,
        ]);
    }

    public function closeQrSession(AttendanceQrSession $session): AttendanceQrSession
    {
        $session->update([
            'status' => 'cerrado',
            'closed_at' => now(),
        ]);

        return $session->fresh();
    }

    public function markStudentFromQrSession(AttendanceQrSession $session, string $studentId, ?string $profileId): array
    {
        $this->ensureQrSessionIsAvailable($session);

        $studentBelongsToSection = StudentCourseEnrollment::query()
            ->where('student_id', $studentId)
            ->where('section_id', $session->section_id)
            ->where('academic_year_id', $session->academic_year_id)
            ->where('status', 'active')
            ->exists();

        if (!$studentBelongsToSection) {
            abort(422, 'El estudiante no pertenece al aula asociada a este QR.');
        }

        $status = 'presente';
        if (
            $session->checkpoint_type === 'entrada'
            && $session->opened_at
            && now()->greaterThan($session->opened_at->copy()->addMinutes((int) $session->late_after_minutes))
        ) {
            $status = 'tarde';
        }

        return $this->storeSectionCheckpoint(
            (string) $session->section_id,
            (string) $session->academic_year_id,
            $session->date->toDateString(),
            (string) $session->checkpoint_type,
            [[
                'student_id' => $studentId,
                'status' => $status,
                'note' => sprintf('Marcado por QR %s.', $session->session_code),
            ]],
            $profileId,
            'qr'
        );
    }

    public function getStudentDailyRecords(string $studentId, ?string $dateFrom = null, ?string $dateTo = null): Collection
    {
        return AttendanceDailyRecord::query()
            ->where('student_id', $studentId)
            ->when($dateFrom, fn ($query) => $query->whereDate('date', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('date', '<=', $dateTo))
            ->orderByDesc('date')
            ->get([
                'id',
                'student_id',
                'section_id',
                'academic_year_id',
                'date',
                'entry_status',
                'entry_note',
                'entry_marked_at',
                'entry_source',
                'exit_status',
                'exit_note',
                'exit_marked_at',
                'exit_source',
            ])
            ->map(function (AttendanceDailyRecord $record) {
                return [
                    'id' => (string) $record->id,
                    'student_id' => (string) $record->student_id,
                    'section_id' => (string) $record->section_id,
                    'academic_year_id' => (string) $record->academic_year_id,
                    'date' => $record->date->toDateString(),
                    'entry_status' => $record->entry_status,
                    'entry_note' => $record->entry_note,
                    'entry_marked_at' => optional($record->entry_marked_at)?->toIso8601String(),
                    'entry_source' => $record->entry_source,
                    'exit_status' => $record->exit_status,
                    'exit_note' => $record->exit_note,
                    'exit_marked_at' => optional($record->exit_marked_at)?->toIso8601String(),
                    'exit_source' => $record->exit_source,
                    'effective_status' => $record->entry_status,
                ];
            })
            ->values();
    }

    private function resolveStudentCourseIdsForDate(
        string $studentId,
        string $sectionId,
        string $academicYearId,
        string $date
    ): array {
        $enrollmentQuery = StudentCourseEnrollment::query()
            ->where('student_id', $studentId)
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active');

        $scheduledCourses = collect($this->resolveScheduledCourses($sectionId, $academicYearId, $date)['courses'])
            ->pluck('course_id')
            ->filter()
            ->unique()
            ->values();

        if ($scheduledCourses->isNotEmpty()) {
            $enrollmentQuery->whereIn('course_id', $scheduledCourses);
        }

        return $enrollmentQuery
            ->pluck('course_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function resolveScheduledCourses(string $sectionId, string $academicYearId, string $date): array
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeekIso;

        $courses = DB::table('course_schedules as cs')
            ->leftJoin('courses as c', 'c.id', '=', 'cs.course_id')
            ->select([
                'cs.course_id',
                DB::raw("COALESCE(c.name, '') as course_name"),
                DB::raw("COALESCE(c.code, '') as course_code"),
                'cs.start_time',
                'cs.end_time',
            ])
            ->where('cs.section_id', $sectionId)
            ->where('cs.academic_year_id', $academicYearId)
            ->where('cs.day_of_week', $dayOfWeek)
            ->orderBy('cs.start_time')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->values()
            ->all();

        return [
            'uses_schedule' => $courses !== [],
            'courses' => $courses,
        ];
    }

    private function hasApprovedJustificationConflict(string $studentId, array $courseIds, string $date): bool
    {
        if ($courseIds === []) {
            return false;
        }

        return DB::table('attendance_justifications as aj')
            ->join('attendance as a', 'a.id', '=', 'aj.attendance_id')
            ->where('a.student_id', $studentId)
            ->whereIn('a.course_id', $courseIds)
            ->whereDate('a.date', $date)
            ->where('aj.status', 'aprobada')
            ->exists();
    }

    private function ensureQrSessionIsAvailable(AttendanceQrSession $session): void
    {
        if ($session->status !== 'activo') {
            abort(422, 'La sesion QR ya no esta activa.');
        }

        if ($session->expires_at && now()->greaterThan($session->expires_at)) {
            $session->update([
                'status' => 'expirado',
                'closed_at' => now(),
            ]);

            abort(422, 'La sesion QR ha expirado.');
        }
    }

    private function generateUniqueSessionCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (AttendanceQrSession::query()->where('session_code', $code)->exists());

        return $code;
    }
}
