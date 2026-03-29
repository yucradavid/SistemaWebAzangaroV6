<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GradeTaskSubmissionRequest;
use App\Http\Requests\StoreTaskSubmissionRequest;
use App\Http\Requests\UpdateTaskSubmissionRequest;
use App\Models\Assignment;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\TaskSubmission;
use App\Models\Teacher;
use Illuminate\Http\Request;

class TaskSubmissionController extends Controller
{
    private function submissionRelations(): array
    {
        return [
            'assignment',
            'assignment.course:id,code,name',
            'assignment.section:id,section_letter,grade_level_id',
            'assignment.section.gradeLevel:id,grade,level',
            'student:id,student_code,first_name,last_name,section_id',
            'student.section:id,section_letter,grade_level_id',
            'student.section.gradeLevel:id,grade,level',
            'grader',
        ];
    }

    public function index(Request $request)
    {
        $query = TaskSubmission::query()
            ->with($this->submissionRelations());

        $this->applyTeacherScope($query, $request);
        $this->applyStudentScope($query, $request);
        $this->applyGuardianScope($query, $request);

        foreach (['assignment_id', 'student_id', 'status', 'graded_by'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('course_id')) {
            $query->whereHas('assignment', function ($assignmentQuery) use ($request) {
                $assignmentQuery->where('course_id', $request->input('course_id'));
            });
        }

        if ($request->filled('section_id')) {
            $query->whereHas('assignment', function ($assignmentQuery) use ($request) {
                $assignmentQuery->where('section_id', $request->input('section_id'));
            });
        }

        if ($request->filled('from')) {
            $query->where('submission_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('submission_date', '<=', $request->input('to'));
        }

        $sort = $request->input('sort', 'submission_date');
        $dir = strtolower($request->input('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['submission_date', 'created_at', 'updated_at', 'grade'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'submission_date';
        }

        $query->orderBy($sort, $dir);

        return response()->json($query->paginate(20));
    }

    public function store(StoreTaskSubmissionRequest $request)
    {
        $data = $request->validated();
        $assignment = Assignment::query()->findOrFail((string) $data['assignment_id']);

        $resolvedStudentId = $this->resolveStudentId($request);
        if ($request->user()?->profile?->role === 'student') {
            if (!$resolvedStudentId) {
                return response()->json([
                    'message' => 'No se encontro el estudiante asociado al usuario autenticado.'
                ], 422);
            }

            $this->ensureStudentCanAccessAssignment($assignment, $resolvedStudentId);
            $data['student_id'] = $resolvedStudentId;
        }

        $exists = TaskSubmission::query()
            ->where('assignment_id', $data['assignment_id'])
            ->where('student_id', $data['student_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe una entrega para este estudiante en esta tarea. Usa update.'
            ], 422);
        }

        $data['submission_date'] = now();
        $data['status'] = $data['status'] ?? 'submitted';

        $row = TaskSubmission::create($data);

        return response()->json([
            'message' => 'Entrega creada',
            'data' => $row->load($this->submissionRelations())
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $row = TaskSubmission::with($this->submissionRelations())->find($id);

        if (!$row) {
            return response()->json(['message' => 'Entrega no encontrada'], 404);
        }

        $this->ensureTeacherCanAccessSubmission($request, $row);
        $this->ensureStudentCanAccessSubmission($request, $row);
        $this->ensureGuardianCanAccessSubmission($request, $row);

        return response()->json($row);
    }

    public function update(UpdateTaskSubmissionRequest $request, $id)
    {
        $row = TaskSubmission::with('assignment')->find($id);

        if (!$row) {
            return response()->json(['message' => 'Entrega no encontrada'], 404);
        }

        $this->ensureStudentCanAccessSubmission($request, $row);

        $data = $request->validated();
        $data['submission_date'] = now();

        $row->update($data);

        return response()->json([
            'message' => 'Entrega actualizada',
            'data' => $row->load($this->submissionRelations())
        ]);
    }

    public function destroy($id)
    {
        $row = TaskSubmission::with('assignment')->find($id);

        if (!$row) {
            return response()->json(['message' => 'Entrega no encontrada'], 404);
        }

        $this->ensureStudentCanAccessSubmission(request(), $row);

        $row->delete();

        return response()->json(['message' => 'Entrega eliminada']);
    }

    public function grade(GradeTaskSubmissionRequest $request, $id)
    {
        $row = TaskSubmission::find($id);

        if (!$row) {
            return response()->json(['message' => 'Entrega no encontrada'], 404);
        }

        $this->ensureTeacherCanAccessSubmission($request, $row);

        $profile = $request->user()?->profile;
        if (!$profile) {
            return response()->json([
                'message' => 'No se encontro perfil asociado al usuario autenticado.'
            ], 422);
        }

        $data = $request->validated();
        $data['graded_by'] = $profile->id;
        $data['graded_at'] = now();
        $data['status'] = $data['status'] ?? 'graded';

        $row->update($data);

        return response()->json([
            'message' => 'Entrega calificada',
            'data' => $row->load($this->submissionRelations())
        ]);
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

        $query->whereHas('assignment', function ($assignmentQuery) use ($teacherId) {
            $assignmentQuery->whereExists(function ($subQuery) use ($teacherId) {
                $subQuery->selectRaw('1')
                    ->from('teacher_course_assignments as tca')
                    ->whereColumn('tca.course_id', 'assignments.course_id')
                    ->whereColumn('tca.section_id', 'assignments.section_id')
                    ->where('tca.teacher_id', $teacherId)
                    ->where('tca.is_active', true);
            });
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

        $query->where('student_id', $studentId);
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
                ->from('student_guardians as sg')
                ->whereColumn('sg.student_id', 'task_submissions.student_id')
                ->where('sg.guardian_id', $guardianId);

            if ($studentId !== '') {
                $subQuery->where('sg.student_id', $studentId);
            }
        });
    }

    private function ensureTeacherCanAccessSubmission(Request $request, TaskSubmission $submission): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            abort(403, 'No se encontro el docente asociado al usuario autenticado.');
        }

        $submission->loadMissing('assignment');

        $assignment = $submission->assignment;
        if (!$assignment) {
            abort(404, 'No se encontro la tarea asociada a la entrega.');
        }

        $isAssigned = \App\Models\TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('course_id', (string) $assignment->course_id)
            ->where('section_id', (string) $assignment->section_id)
            ->where('is_active', true)
            ->exists();

        if (!$isAssigned) {
            abort(403, 'No tienes acceso a las entregas de esta tarea.');
        }
    }

    private function ensureStudentCanAccessSubmission(Request $request, TaskSubmission $submission): void
    {
        if ($request->user()?->profile?->role !== 'student') {
            return;
        }

        $studentId = $this->resolveStudentId($request);

        if (!$studentId) {
            abort(403, 'No se encontro el estudiante asociado al usuario autenticado.');
        }

        if ((string) $submission->student_id !== $studentId) {
            abort(403, 'No tienes acceso a esta entrega.');
        }

        $submission->loadMissing('assignment');

        if (!$submission->assignment) {
            abort(404, 'No se encontro la tarea asociada a la entrega.');
        }

        $this->ensureStudentCanAccessAssignment($submission->assignment, $studentId);
    }

    private function ensureStudentCanAccessAssignment(Assignment $assignment, string $studentId): void
    {
        $isEnrolled = StudentCourseEnrollment::query()
            ->where('student_id', $studentId)
            ->where('course_id', (string) $assignment->course_id)
            ->where('section_id', (string) $assignment->section_id)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            abort(403, 'No tienes acceso a tareas de este curso.');
        }
    }

    private function ensureGuardianCanAccessSubmission(Request $request, TaskSubmission $submission): void
    {
        if ($request->user()?->profile?->role !== 'guardian') {
            return;
        }

        $guardianId = $this->resolveGuardianId($request);

        if (!$guardianId) {
            abort(403, 'No se encontro el apoderado asociado al usuario autenticado.');
        }

        $studentId = (string) $request->input('student_id', $submission->student_id);

        if (!$this->guardianHasStudent($guardianId, $studentId)) {
            abort(403, 'No tienes acceso a esta entrega.');
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
