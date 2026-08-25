<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentExtracurricularActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentExtracurricularActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $academicYearId = $request->query('academic_year_id') ?: $this->activeAcademicYearId();

        $query = StudentExtracurricularActivity::query()
            ->with('student')
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true);

        if ($request->filled('section_id')) {
            $studentIds = StudentCourseEnrollment::query()
                ->where('section_id', $request->query('section_id'))
                ->where('academic_year_id', $academicYearId)
                ->where('status', 'active')
                ->pluck('student_id')
                ->unique();

            $query->whereIn('student_id', $studentIds);
        }

        return response()->json(['data' => $query->orderByDesc('created_at')->get()]);
    }

    public function assign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_ids' => 'nullable|array|min:1',
            'student_ids.*' => 'uuid|exists:students,id',
            'scope' => 'nullable|array',
            'scope.section_id' => 'required_with:scope|uuid|exists:sections,id',
            'activity_name' => 'required|string|max:255',
            'activity_end_time' => 'required|date_format:H:i',
        ]);

        if (empty($validated['student_ids']) && empty($validated['scope'])) {
            throw ValidationException::withMessages([
                'student_ids' => 'Debes indicar student_ids o un scope (seccion).',
            ]);
        }

        $academicYearId = $this->activeAcademicYearId();

        if (!$academicYearId) {
            return response()->json(['message' => 'No hay un año academico activo.'], 422);
        }

        $studentIds = collect($validated['student_ids'] ?? []);

        if (!empty($validated['scope']['section_id'])) {
            $scopeStudentIds = StudentCourseEnrollment::query()
                ->where('section_id', $validated['scope']['section_id'])
                ->where('academic_year_id', $academicYearId)
                ->where('status', 'active')
                ->pluck('student_id')
                ->unique();

            $studentIds = $studentIds->merge($scopeStudentIds)->unique();
        }

        if ($studentIds->isEmpty()) {
            return response()->json(['message' => 'No se encontraron alumnos para asignar.'], 422);
        }

        $actorId = (string) $request->user()->id;
        $created = 0;

        DB::transaction(function () use ($studentIds, $validated, $academicYearId, $actorId, &$created) {
            foreach ($studentIds as $studentId) {
                StudentExtracurricularActivity::create([
                    'student_id' => $studentId,
                    'activity_name' => $validated['activity_name'],
                    'activity_end_time' => $validated['activity_end_time'],
                    'academic_year_id' => $academicYearId,
                    'is_active' => true,
                    'assigned_by' => $actorId,
                ]);
                $created++;
            }
        });

        return response()->json([
            'message' => "Actividad asignada a {$created} alumno(s).",
            'created' => $created,
        ], 201);
    }

    public function deactivate(string $id): JsonResponse
    {
        $activity = StudentExtracurricularActivity::find($id);

        if (!$activity) {
            return response()->json(['message' => 'Asignacion no encontrada.'], 404);
        }

        $activity->update(['is_active' => false]);

        return response()->json(['message' => 'Asignacion desactivada.', 'data' => $activity->fresh()]);
    }

    private function activeAcademicYearId(): ?string
    {
        return AcademicYear::query()->where('is_active', true)->value('id');
    }
}
