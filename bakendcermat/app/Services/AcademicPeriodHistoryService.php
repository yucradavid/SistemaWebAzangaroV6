<?php

namespace App\Services;

use App\Models\AcademicPeriodHistory;
use App\Models\AcademicPeriodStudentSnapshot;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Message;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\TaskSubmission;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AcademicPeriodHistoryService
{
    public function generateForPeriod(Period $period, int|string|null $generatedBy = null): AcademicPeriodHistory
    {
        $period->loadMissing('academicYear');

        return DB::transaction(function () use ($period, $generatedBy) {
            $history = AcademicPeriodHistory::query()->updateOrCreate(
                ['period_id' => (string) $period->id],
                [
                    'academic_year_id' => (string) $period->academic_year_id,
                    'generated_by' => $generatedBy !== null ? (string) $generatedBy : null,
                    'generated_at' => now(),
                    'is_finalized' => (bool) $period->is_closed,
                    'summary' => [],
                ]
            );

            $students = $this->loadPeriodStudents($period);
            $totals = [
                'students_count' => $students->count(),
                'evaluations_count' => 0,
                'attendance_count' => 0,
                'assignments_count' => 0,
                'task_submissions_count' => 0,
                'assignment_submissions_count' => 0,
                'messages_count' => 0,
            ];
            $coverage = [
                'evaluations' => 0,
                'attendance' => 0,
                'assignments' => 0,
                'messages' => 0,
            ];
            $snapshotIds = [];

            foreach ($students as $student) {
                $snapshot = $this->buildStudentSnapshot($student, $period);
                $meta = $snapshot['meta'];

                $totals['evaluations_count'] += $meta['evaluations_count'];
                $totals['attendance_count'] += $meta['attendance_count'];
                $totals['assignments_count'] += $meta['assignments_count'];
                $totals['task_submissions_count'] += $meta['task_submissions_count'];
                $totals['assignment_submissions_count'] += $meta['assignment_submissions_count'];
                $totals['messages_count'] += $meta['messages_count'];

                if ($meta['evaluations_count'] > 0) {
                    $coverage['evaluations']++;
                }
                if ($meta['attendance_count'] > 0) {
                    $coverage['attendance']++;
                }
                if ($meta['assignments_count'] > 0) {
                    $coverage['assignments']++;
                }
                if ($meta['messages_count'] > 0) {
                    $coverage['messages']++;
                }

                $row = AcademicPeriodStudentSnapshot::query()->updateOrCreate(
                    [
                        'academic_period_history_id' => (string) $history->id,
                        'student_id' => (string) $student->id,
                    ],
                    [
                        'section_id' => $snapshot['student']['section']['id'] ?? null,
                        'student_code' => $snapshot['student']['student_code'],
                        'student_name' => $snapshot['student']['full_name'],
                        'snapshot' => $snapshot,
                    ]
                );

                $snapshotIds[] = $row->id;
            }

            AcademicPeriodStudentSnapshot::query()
                ->where('academic_period_history_id', $history->id)
                ->when($snapshotIds !== [], fn ($query) => $query->whereNotIn('id', $snapshotIds))
                ->delete();

            $history->update([
                'generated_by' => $generatedBy !== null ? (string) $generatedBy : null,
                'generated_at' => now(),
                'is_finalized' => (bool) $period->is_closed,
                'students_count' => $totals['students_count'],
                'evaluations_count' => $totals['evaluations_count'],
                'attendance_count' => $totals['attendance_count'],
                'assignments_count' => $totals['assignments_count'],
                'task_submissions_count' => $totals['task_submissions_count'],
                'assignment_submissions_count' => $totals['assignment_submissions_count'],
                'messages_count' => $totals['messages_count'],
                'summary' => $this->buildSummary($period, $totals, $coverage),
            ]);

            return $history->fresh([
                'period',
                'academicYear',
                'generatedBy',
            ]);
        });
    }

    private function loadPeriodStudents(Period $period): Collection
    {
        $studentIds = StudentCourseEnrollment::query()
            ->where('academic_year_id', $period->academic_year_id)
            ->distinct()
            ->pluck('student_id');

        return Student::query()
            ->with(['section.gradeLevel'])
            ->whereIn('id', $studentIds)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    private function buildStudentSnapshot(Student $student, Period $period): array
    {
        $periodStart = Carbon::parse($period->start_date)->startOfDay();
        $periodEnd = Carbon::parse($period->end_date)->endOfDay();

        $enrollments = StudentCourseEnrollment::query()
            ->with(['course:id,code,name', 'section.gradeLevel'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $period->academic_year_id)
            ->orderBy('course_id')
            ->get();

        $evaluations = Evaluation::query()
            ->with([
                'course:id,code,name',
                'competency:id,course_id,code,description',
                'period:id,name,period_number,start_date,end_date',
            ])
            ->where('student_id', $student->id)
            ->where('period_id', $period->id)
            ->orderBy('course_id')
            ->get();

        $attendance = Attendance::query()
            ->with(['course:id,code,name', 'section.gradeLevel'])
            ->where('student_id', $student->id)
            ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->orderBy('date')
            ->get();

        $assignments = Assignment::query()
            ->with(['course:id,code,name', 'section.gradeLevel'])
            ->whereExists(function ($query) use ($student, $period) {
                $query->selectRaw('1')
                    ->from('student_course_enrollments as sce')
                    ->whereColumn('sce.course_id', 'assignments.course_id')
                    ->whereColumn('sce.section_id', 'assignments.section_id')
                    ->where('sce.student_id', (string) $student->id)
                    ->where('sce.academic_year_id', (string) $period->academic_year_id);
            })
            ->where(function ($query) use ($periodStart, $periodEnd) {
                $query->whereBetween('due_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
                    ->orWhereBetween('created_at', [$periodStart, $periodEnd]);
            })
            ->orderBy('due_date')
            ->orderBy('created_at')
            ->get();

        $assignmentIds = $assignments->pluck('id')->filter()->values();

        $taskSubmissions = TaskSubmission::query()
            ->with(['assignment.course:id,code,name', 'grader:id,full_name'])
            ->where('student_id', $student->id)
            ->where(function ($query) use ($assignmentIds, $periodStart, $periodEnd) {
                if ($assignmentIds->isNotEmpty()) {
                    $query->whereIn('assignment_id', $assignmentIds)
                        ->orWhereBetween('submission_date', [$periodStart, $periodEnd]);

                    return;
                }

                $query->whereBetween('submission_date', [$periodStart, $periodEnd]);
            })
            ->orderBy('submission_date')
            ->get();

        $assignmentSubmissions = AssignmentSubmission::query()
            ->with(['assignment.course:id,code,name', 'reviewer:id,name,email'])
            ->where('student_id', $student->id)
            ->where(function ($query) use ($assignmentIds, $periodStart, $periodEnd) {
                if ($assignmentIds->isNotEmpty()) {
                    $query->whereIn('assignment_id', $assignmentIds)
                        ->orWhereBetween('submitted_at', [$periodStart, $periodEnd])
                        ->orWhereBetween('created_at', [$periodStart, $periodEnd]);

                    return;
                }

                $query->whereBetween('submitted_at', [$periodStart, $periodEnd])
                    ->orWhereBetween('created_at', [$periodStart, $periodEnd]);
            })
            ->orderBy('submitted_at')
            ->orderBy('created_at')
            ->get();

        $messages = Message::query()
            ->with(['sender:id,full_name,role,user_id'])
            ->where('student_id', $student->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->orderBy('created_at')
            ->get();

        $attendanceSummary = [
            'records' => $attendance->count(),
            'present' => $attendance->where('status', 'presente')->count(),
            'late' => $attendance->where('status', 'tarde')->count(),
            'absent' => $attendance->where('status', 'falta')->count(),
            'justified' => $attendance->where('status', 'justificado')->count(),
        ];

        $evaluationSummary = [
            'records' => $evaluations->count(),
            'published_or_closed' => $evaluations->filter(
                fn (Evaluation $evaluation) => in_array($evaluation->status, ['publicada', 'cerrada'], true)
            )->count(),
            'drafts' => $evaluations->where('status', 'borrador')->count(),
            'levels' => [
                'AD' => $evaluations->where('grade', 'AD')->count(),
                'A' => $evaluations->where('grade', 'A')->count(),
                'B' => $evaluations->where('grade', 'B')->count(),
                'C' => $evaluations->where('grade', 'C')->count(),
            ],
        ];

        return [
            'student' => [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'full_name' => $student->full_name,
                'section' => [
                    'id' => $student->section?->id,
                    'section_letter' => $student->section?->section_letter,
                    'grade_level' => $student->section?->gradeLevel ? [
                        'id' => $student->section->gradeLevel->id,
                        'name' => $student->section->gradeLevel->name,
                        'grade' => $student->section->gradeLevel->grade,
                        'level' => $student->section->gradeLevel->level,
                    ] : null,
                ],
            ],
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'period_number' => $period->period_number,
                'start_date' => optional($period->start_date)->format('Y-m-d') ?? (string) $period->start_date,
                'end_date' => optional($period->end_date)->format('Y-m-d') ?? (string) $period->end_date,
                'academic_year_id' => $period->academic_year_id,
            ],
            'enrollments' => $enrollments->map(function (StudentCourseEnrollment $enrollment) {
                return [
                    'id' => $enrollment->id,
                    'course_id' => $enrollment->course_id,
                    'course' => $enrollment->course ? [
                        'id' => $enrollment->course->id,
                        'code' => $enrollment->course->code,
                        'name' => $enrollment->course->name,
                    ] : null,
                    'section_id' => $enrollment->section_id,
                    'section' => $enrollment->section ? [
                        'id' => $enrollment->section->id,
                        'section_letter' => $enrollment->section->section_letter,
                        'grade_level' => $enrollment->section->gradeLevel ? [
                            'id' => $enrollment->section->gradeLevel->id,
                            'name' => $enrollment->section->gradeLevel->name,
                        ] : null,
                    ] : null,
                    'status' => $enrollment->status,
                    'enrollment_date' => optional($enrollment->enrollment_date)?->format('Y-m-d H:i:s'),
                ];
            })->values()->all(),
            'evaluations' => [
                'summary' => $evaluationSummary,
                'items' => $evaluations->map(function (Evaluation $evaluation) {
                    return [
                        'id' => $evaluation->id,
                        'course_id' => $evaluation->course_id,
                        'course_name' => $evaluation->course?->name,
                        'competency_id' => $evaluation->competency_id,
                        'competency_name' => $evaluation->competency?->name ?? $evaluation->competency?->description,
                        'period_id' => $evaluation->period_id,
                        'grade' => $evaluation->grade,
                        'status' => $evaluation->status,
                        'comments' => $evaluation->observations ?? $evaluation->comments,
                        'published_at' => optional($evaluation->published_at)?->toISOString(),
                    ];
                })->values()->all(),
            ],
            'attendance' => [
                'summary' => $attendanceSummary,
                'items' => $attendance->map(function (Attendance $record) {
                    return [
                        'id' => $record->id,
                        'date' => optional($record->date)?->format('Y-m-d'),
                        'course_id' => $record->course_id,
                        'course_name' => $record->course?->name,
                        'section_id' => $record->section_id,
                        'section_letter' => $record->section?->section_letter,
                        'status' => $record->status,
                        'justification' => $record->justification,
                    ];
                })->values()->all(),
            ],
            'assignments' => [
                'summary' => [
                    'published' => $assignments->count(),
                    'task_submissions' => $taskSubmissions->count(),
                    'assignment_submissions' => $assignmentSubmissions->count(),
                    'graded_task_submissions' => $taskSubmissions->where('status', 'graded')->count(),
                    'reviewed_assignment_submissions' => $assignmentSubmissions->where('status', 'reviewed')->count(),
                ],
                'items' => $assignments->map(function (Assignment $assignment) {
                    return [
                        'id' => $assignment->id,
                        'course_id' => $assignment->course_id,
                        'course_name' => $assignment->course?->name,
                        'section_id' => $assignment->section_id,
                        'section_letter' => $assignment->section?->section_letter,
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'instructions' => $assignment->instructions,
                        'due_date' => optional($assignment->due_date)?->format('Y-m-d H:i:s') ?? $assignment->due_date,
                        'max_score' => $assignment->max_score,
                        'attachment_url' => $assignment->attachment_url,
                    ];
                })->values()->all(),
                'task_submissions' => $taskSubmissions->map(function (TaskSubmission $submission) {
                    return [
                        'id' => $submission->id,
                        'assignment_id' => $submission->assignment_id,
                        'assignment_title' => $submission->assignment?->title,
                        'course_name' => $submission->assignment?->course?->name,
                        'submission_date' => optional($submission->submission_date)?->toISOString(),
                        'status' => $submission->status,
                        'grade' => $submission->grade,
                        'grade_letter' => $submission->grade_letter,
                        'feedback' => $submission->feedback,
                        'graded_at' => optional($submission->graded_at)?->toISOString(),
                        'grader' => $submission->grader?->full_name,
                    ];
                })->values()->all(),
                'assignment_submissions' => $assignmentSubmissions->map(function (AssignmentSubmission $submission) {
                    return [
                        'id' => $submission->id,
                        'assignment_id' => $submission->assignment_id,
                        'assignment_title' => $submission->assignment?->title,
                        'course_name' => $submission->assignment?->course?->name,
                        'status' => $submission->status,
                        'score' => $submission->score,
                        'feedback' => $submission->feedback,
                        'submitted_at' => optional($submission->submitted_at)?->toISOString(),
                        'reviewed_at' => optional($submission->reviewed_at)?->toISOString(),
                    ];
                })->values()->all(),
            ],
            'messages' => [
                'summary' => [
                    'total' => $messages->count(),
                    'unread' => $messages->where('is_read', false)->count(),
                    'teacher_messages' => $messages->where('sender_role', 'teacher')->count(),
                    'guardian_messages' => $messages->where('sender_role', 'guardian')->count(),
                ],
                'items' => $messages->map(function (Message $message) {
                    return [
                        'id' => $message->id,
                        'sender_role' => $message->sender_role,
                        'sender_id' => $message->sender_id,
                        'sender_name' => $message->sender?->full_name,
                        'content' => $message->content,
                        'is_read' => $message->is_read,
                        'created_at' => optional($message->created_at)?->toISOString(),
                    ];
                })->values()->all(),
            ],
            'conduct' => [
                'module_available' => false,
                'summary' => null,
                'message' => 'El modulo de conducta todavia no tiene una fuente historica dedicada en el backend actual.',
            ],
            'meta' => [
                'evaluations_count' => $evaluations->count(),
                'attendance_count' => $attendance->count(),
                'assignments_count' => $assignments->count(),
                'task_submissions_count' => $taskSubmissions->count(),
                'assignment_submissions_count' => $assignmentSubmissions->count(),
                'messages_count' => $messages->count(),
                'snapshot_generated_at' => now()->toISOString(),
            ],
        ];
    }

    private function buildSummary(Period $period, array $totals, array $coverage): array
    {
        $studentsCount = max((int) $totals['students_count'], 1);

        return [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'period_number' => $period->period_number,
                'is_closed' => (bool) $period->is_closed,
            ],
            'academic_year' => [
                'id' => $period->academic_year_id,
                'year' => $period->academicYear?->year,
            ],
            'totals' => $totals,
            'coverage' => [
                'students_with_evaluations' => $coverage['evaluations'],
                'students_with_attendance' => $coverage['attendance'],
                'students_with_assignments' => $coverage['assignments'],
                'students_with_messages' => $coverage['messages'],
                'evaluation_coverage_rate' => round(($coverage['evaluations'] / $studentsCount) * 100, 1),
                'attendance_coverage_rate' => round(($coverage['attendance'] / $studentsCount) * 100, 1),
                'assignment_coverage_rate' => round(($coverage['assignments'] / $studentsCount) * 100, 1),
                'message_coverage_rate' => round(($coverage['messages'] / $studentsCount) * 100, 1),
            ],
            'notes' => [
                'Las notas se congelan por period_id.',
                'La asistencia se resume por rango de fechas del periodo.',
                'Las tareas se infieren por curso, seccion y fechas dentro del periodo.',
                'La conducta queda marcada para una futura integracion formal del modulo.',
            ],
        ];
    }
}
