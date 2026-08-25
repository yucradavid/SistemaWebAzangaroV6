<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Models\TeacherShiftAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftAssignmentController extends Controller
{
    public function indexSections(Request $request): JsonResponse
    {
        $academicYearId = $request->query('academic_year_id') ?: $this->activeAcademicYearId();

        $sections = Section::query()
            ->with('gradeLevel')
            ->where('academic_year_id', $academicYearId)
            ->orderBy('grade_level_id')
            ->orderBy('section_letter')
            ->get();

        return response()->json(['data' => $sections]);
    }

    public function updateSectionShifts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array|min:1',
            'assignments.*.section_id' => 'required|uuid|exists:sections,id',
            'assignments.*.shift' => 'required|string|in:manana,tarde',
        ]);

        $updated = 0;

        DB::transaction(function () use ($validated, &$updated) {
            foreach ($validated['assignments'] as $assignment) {
                Section::where('id', $assignment['section_id'])
                    ->update(['shift' => $assignment['shift']]);
                $updated++;
            }
        });

        return response()->json(['message' => "Turno actualizado en {$updated} seccion(es).", 'updated' => $updated]);
    }

    public function indexTeacherShifts(Request $request): JsonResponse
    {
        $academicYearId = $request->query('academic_year_id') ?: $this->activeAcademicYearId();

        $assignments = TeacherShiftAssignment::query()
            ->with('teacher')
            ->where('academic_year_id', $academicYearId)
            ->get();

        return response()->json(['data' => $assignments]);
    }

    public function updateTeacherShifts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array|min:1',
            'assignments.*.teacher_id' => 'required|uuid|exists:teachers,id',
            'assignments.*.shift' => 'required|string|in:manana,tarde',
        ]);

        $academicYearId = $this->activeAcademicYearId();

        if (!$academicYearId) {
            return response()->json(['message' => 'No hay un año academico activo.'], 422);
        }

        $actorId = (string) $request->user()->id;
        $updated = 0;

        DB::transaction(function () use ($validated, $academicYearId, $actorId, &$updated) {
            foreach ($validated['assignments'] as $assignment) {
                TeacherShiftAssignment::updateOrCreate(
                    ['teacher_id' => $assignment['teacher_id'], 'academic_year_id' => $academicYearId],
                    ['shift' => $assignment['shift'], 'assigned_by' => $actorId]
                );
                $updated++;
            }
        });

        return response()->json(['message' => "Turno actualizado en {$updated} docente(s).", 'updated' => $updated]);
    }

    private function activeAcademicYearId(): ?string
    {
        return AcademicYear::query()->where('is_active', true)->value('id');
    }
}
