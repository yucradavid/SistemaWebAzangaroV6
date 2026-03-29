<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherCourseAssignments\StoreTeacherCourseAssignmentRequest;
use App\Http\Requests\TeacherCourseAssignments\UpdateTeacherCourseAssignmentRequest;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Models\Profile;
use Illuminate\Http\Request;

class TeacherCourseAssignmentController extends Controller
{
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
        $assignment = TeacherCourseAssignment::create($data);

        return response()->json([
            'message' => 'Asignación creada',
            'data' => $assignment->load(['teacher', 'course', 'section', 'academicYear', 'assignedByProfile'])
        ], 201);
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
