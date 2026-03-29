<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Models\Assignment;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\TaskSubmission;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AssignmentController extends Controller
{
    private function assignmentRelations(): array
    {
        return [
            'course:id,code,name',
            'section:id,section_letter,grade_level_id',
            'section.gradeLevel:id,grade,level',
        ];
    }

    public function index(Request $request)
    {
        $query = Assignment::query()
            ->with($this->assignmentRelations());

        $this->applyTeacherScope($query, $request);
        $this->applyStudentScope($query, $request);
        $this->applyGuardianScope($query, $request);

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->filled('date_from')) {
            $dateFrom = (string) $request->input('date_from');
            $query->where(function ($dateQuery) use ($dateFrom) {
                $dateQuery->whereDate('due_date', '>=', $dateFrom)
                    ->orWhere(function ($fallbackQuery) use ($dateFrom) {
                        $fallbackQuery->whereNull('due_date')
                            ->whereDate('created_at', '>=', $dateFrom);
                    });
            });
        }

        if ($request->filled('date_to')) {
            $dateTo = (string) $request->input('date_to');
            $query->where(function ($dateQuery) use ($dateTo) {
                $dateQuery->whereDate('due_date', '<=', $dateTo)
                    ->orWhere(function ($fallbackQuery) use ($dateTo) {
                        $fallbackQuery->whereNull('due_date')
                            ->whereDate('created_at', '<=', $dateTo);
                    });
            });
        }

        if ($request->filled('student_id') && $request->user()?->profile?->role !== 'guardian') {
            $query->whereExists(function ($subQuery) use ($request) {
                $subQuery->selectRaw('1')
                    ->from('student_course_enrollments as sce')
                    ->whereColumn('sce.course_id', 'assignments.course_id')
                    ->whereColumn('sce.section_id', 'assignments.section_id')
                    ->where('sce.student_id', (string) $request->input('student_id'))
                    ->where('sce.status', 'active');
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate((int) $request->integer('per_page', 20));
        $paginator->getCollection()->transform(
            fn (Assignment $assignment) => $this->appendAssignmentMetrics($assignment)
        );

        return response()->json($paginator);
    }

    public function store(StoreAssignmentRequest $request)
    {
        $data = $request->validated();
        unset($data['created_by']);

        $this->ensureTeacherCanManageAssignment(
            $request,
            (string) $data['course_id'],
            (string) $data['section_id']
        );

        $assignment = Assignment::create($data);

        return response()->json(
            $this->appendAssignmentMetrics($assignment->load($this->assignmentRelations())),
            201
        );
    }

    public function show(Request $request, Assignment $assignment)
    {
        $this->ensureTeacherCanManageAssignment(
            $request,
            (string) $assignment->course_id,
            (string) $assignment->section_id
        );
        $this->ensureStudentCanAccessAssignment($request, $assignment);
        $this->ensureGuardianCanAccessAssignment($request, $assignment);

        return $this->appendAssignmentMetrics($assignment->load($this->assignmentRelations()));
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        $this->ensureTeacherCanManageAssignment(
            $request,
            (string) $assignment->course_id,
            (string) $assignment->section_id
        );

        $data = $request->validated();
        unset($data['created_by']);

        $targetCourseId = (string) ($data['course_id'] ?? $assignment->course_id);
        $targetSectionId = (string) ($data['section_id'] ?? $assignment->section_id);

        $this->ensureTeacherCanManageAssignment($request, $targetCourseId, $targetSectionId);

        $assignment->update($data);

        return $this->appendAssignmentMetrics($assignment->load($this->assignmentRelations()));
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $this->ensureTeacherCanManageAssignment(
            $request,
            (string) $assignment->course_id,
            (string) $assignment->section_id
        );

        $assignment->delete();

        return response()->noContent();
    }

    public function submissionsSummary(Request $request, Assignment $assignment)
    {
        $this->ensureTeacherCanManageAssignment(
            $request,
            (string) $assignment->course_id,
            (string) $assignment->section_id
        );

        $assignment->load($this->assignmentRelations());

        $enrollments = StudentCourseEnrollment::query()
            ->with([
                'student:id,student_code,first_name,last_name,section_id',
                'student.section:id,section_letter,grade_level_id',
                'student.section.gradeLevel:id,grade,level',
            ])
            ->where('course_id', $assignment->course_id)
            ->where('section_id', $assignment->section_id)
            ->where('status', 'active')
            ->orderByDesc('enrollment_date')
            ->get();

        $submissions = TaskSubmission::query()
            ->with([
                'student:id,student_code,first_name,last_name,section_id',
                'student.section:id,section_letter,grade_level_id',
                'student.section.gradeLevel:id,grade,level',
                'grader',
            ])
            ->where('assignment_id', $assignment->id)
            ->get()
            ->keyBy('student_id');

        $rows = $enrollments->map(function (StudentCourseEnrollment $enrollment) use ($submissions) {
            $submission = $submissions->get($enrollment->student_id);
            $student = $enrollment->student;

            return [
                'student_id' => $enrollment->student_id,
                'student' => $student,
                'enrollment' => [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status,
                    'enrollment_date' => $enrollment->enrollment_date,
                ],
                'submission' => $submission,
                'status' => $submission?->status ?? 'missing',
            ];
        })->values();

        return response()->json([
            'assignment' => $this->appendAssignmentMetrics($assignment),
            'summary' => $this->buildAssignmentMetrics($assignment),
            'rows' => $rows,
        ]);
    }

    private function appendAssignmentMetrics(Assignment $assignment): Assignment
    {
        $metrics = $this->buildAssignmentMetrics($assignment);
        $timingStatus = $this->buildTimingStatus($assignment);

        $assignment->setAttribute('metrics', $metrics);
        $assignment->setAttribute('timing_status', $timingStatus);
        $assignment->setAttribute(
            'requires_attention',
            ($metrics['pending_count'] ?? 0) > 0
            || ($metrics['missing_count'] ?? 0) > 0
            || $timingStatus === 'overdue'
        );

        return $assignment;
    }

    private function buildAssignmentMetrics(Assignment $assignment): array
    {
        $expectedCount = StudentCourseEnrollment::query()
            ->where('course_id', $assignment->course_id)
            ->where('section_id', $assignment->section_id)
            ->where('status', 'active')
            ->count();

        $submittedCount = TaskSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->count();

        $gradedCount = TaskSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('status', 'graded')
            ->count();

        $pendingCount = max($submittedCount - $gradedCount, 0);
        $missingCount = max($expectedCount - $submittedCount, 0);
        $averageGrade = TaskSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->whereNotNull('grade')
            ->avg('grade');

        return [
            'expected_count' => $expectedCount,
            'submitted_count' => $submittedCount,
            'graded_count' => $gradedCount,
            'pending_count' => $pendingCount,
            'missing_count' => $missingCount,
            'average_grade' => $averageGrade !== null ? round((float) $averageGrade, 2) : null,
        ];
    }

    private function buildTimingStatus(Assignment $assignment): string
    {
        if (!$assignment->due_date) {
            return 'undated';
        }

        $dueDate = \Illuminate\Support\Carbon::parse($assignment->due_date);
        $today = now();

        if ($dueDate->isSameDay($today)) {
            return 'due_today';
        }

        if ($dueDate->lt($today)) {
            return 'overdue';
        }

        return 'upcoming';
    }

    private function applyTeacherScope($query, Request $request): void
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
            $subQuery->selectRaw('1')
                ->from('teacher_course_assignments as tca')
                ->whereColumn('tca.course_id', 'assignments.course_id')
                ->whereColumn('tca.section_id', 'assignments.section_id')
                ->where('tca.teacher_id', $teacherId);

            if (!$request->boolean('history_scope', false)) {
                $subQuery->where('tca.is_active', true);
            }
        });
    }

    private function applyStudentScope($query, Request $request): void
    {
        if ($request->user()?->profile?->role !== 'student') {
            return;
        }

        $studentId = $this->resolveStudentId($request);

        if (!$studentId) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->whereExists(function ($subQuery) use ($studentId) {
            $subQuery->selectRaw('1')
                ->from('student_course_enrollments as sce')
                ->whereColumn('sce.course_id', 'assignments.course_id')
                ->whereColumn('sce.section_id', 'assignments.section_id')
                ->where('sce.student_id', $studentId)
                ->where('sce.status', 'active');
        });
    }

    private function applyGuardianScope($query, Request $request): void
    {
        if ($request->user()?->profile?->role !== 'guardian') {
            return;
        }

        $guardianId = $this->resolveGuardianId($request);

        if (!$guardianId) {
            $query->whereRaw('1 = 0');
            return;
        }

        $studentId = (string) $request->input('student_id', '');

        if ($studentId !== '' && !$this->guardianHasStudent($guardianId, $studentId)) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->whereExists(function ($subQuery) use ($guardianId, $studentId) {
            $subQuery->selectRaw('1')
                ->from('student_course_enrollments as sce')
                ->join('student_guardians as sg', 'sg.student_id', '=', 'sce.student_id')
                ->whereColumn('sce.course_id', 'assignments.course_id')
                ->whereColumn('sce.section_id', 'assignments.section_id')
                ->where('sg.guardian_id', $guardianId)
                ->where('sce.status', 'active');

            if ($studentId !== '') {
                $subQuery->where('sce.student_id', $studentId);
            }
        });
    }

    private function ensureTeacherCanManageAssignment(Request $request, string $courseId, string $sectionId): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontro el docente asociado al usuario autenticado.',
            ]);
        }

        $isAssigned = \App\Models\TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('course_id', $courseId)
            ->where('section_id', $sectionId)
            ->where('is_active', true)
            ->exists();

        if (!$isAssigned) {
            throw ValidationException::withMessages([
                'assignment' => 'No tienes una asignacion activa para gestionar tareas en este curso y seccion.',
            ]);
        }
    }

    private function ensureStudentCanAccessAssignment(Request $request, Assignment $assignment): void
    {
        if ($request->user()?->profile?->role !== 'student') {
            return;
        }

        $studentId = $this->resolveStudentId($request);

        if (!$studentId) {
            abort(403, 'No se encontro el estudiante asociado al usuario autenticado.');
        }

        $isEnrolled = StudentCourseEnrollment::query()
            ->where('student_id', $studentId)
            ->where('course_id', (string) $assignment->course_id)
            ->where('section_id', (string) $assignment->section_id)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            abort(403, 'No tienes acceso a esta tarea.');
        }
    }

    private function ensureGuardianCanAccessAssignment(Request $request, Assignment $assignment): void
    {
        if ($request->user()?->profile?->role !== 'guardian') {
            return;
        }

        $guardianId = $this->resolveGuardianId($request);

        if (!$guardianId) {
            abort(403, 'No se encontro el apoderado asociado al usuario autenticado.');
        }

        $studentId = (string) $request->input('student_id', '');
        if ($studentId !== '' && !$this->guardianHasStudent($guardianId, $studentId)) {
            abort(403, 'No tienes acceso al estudiante seleccionado.');
        }

        $query = StudentCourseEnrollment::query()
            ->where('course_id', (string) $assignment->course_id)
            ->where('section_id', (string) $assignment->section_id)
            ->where('status', 'active')
            ->whereExists(function ($subQuery) use ($guardianId) {
                $subQuery->selectRaw('1')
                    ->from('student_guardians as sg')
                    ->whereColumn('sg.student_id', 'student_course_enrollments.student_id')
                    ->where('sg.guardian_id', $guardianId);
            });

        if ($studentId !== '') {
            $query->where('student_id', $studentId);
        }

        if (!$query->exists()) {
            abort(403, 'No tienes acceso a esta tarea.');
        }
    }

    private function resolveTeacherId(Request $request): ?string
    {
        return Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }

    private function resolveStudentId(Request $request): ?string
    {
        return Student::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }

    private function resolveGuardianId(Request $request): ?string
    {
        return Guardian::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }

    private function guardianHasStudent(string $guardianId, string $studentId): bool
    {
        return \Illuminate\Support\Facades\DB::table('student_guardians')
            ->where('guardian_id', $guardianId)
            ->where('student_id', $studentId)
            ->exists();
    }
}
