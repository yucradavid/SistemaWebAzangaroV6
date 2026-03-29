<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Services\AcademicEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AcademicEvaluationController extends Controller
{
    public function __construct(
        private readonly AcademicEvaluationService $academicEvaluationService
    ) {
    }

    public function summary(AcademicYear $academicYear, Student $student)
    {
        return response()->json(
            $this->academicEvaluationService->getStudentYearSummary($student, $academicYear)
        );
    }

    public function sectionDashboard(Request $request, AcademicYear $academicYear, Section $section)
    {
        $courseId = $request->filled('course_id') ? (string) $request->course_id : null;

        $this->ensureTeacherCanAccessSectionDashboard($request, $academicYear, $section, $courseId);

        return response()->json(
            $this->academicEvaluationService->getSectionDashboard($section, $academicYear, $request->only([
                'course_id',
                'period_id',
                'competency_id',
            ]))
        );
    }

    public function recalculate(AcademicYear $academicYear, Student $student)
    {
        return response()->json(
            $this->academicEvaluationService->recalculateStudentYear($student, $academicYear, request()->user()?->id)
        );
    }

    public function recalculateSection(Request $request, AcademicYear $academicYear, Section $section)
    {
        if ($request->user()?->profile?->role === 'teacher') {
            return response()->json([
                'message' => 'Solo los roles administrativos pueden recalcular el resumen de la seccion.',
            ], 403);
        }

        return response()->json(
            $this->academicEvaluationService->recalculateSection($section, $academicYear, $request->user()?->id)
        );
    }

    private function ensureTeacherCanAccessSectionDashboard(
        Request $request,
        AcademicYear $academicYear,
        Section $section,
        ?string $courseId
    ): void {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        if (!$courseId) {
            throw ValidationException::withMessages([
                'course_id' => 'Debes indicar un curso para consultar el panel de evaluacion docente.',
            ]);
        }

        $teacherId = Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');

        if (!$teacherId) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontro el docente asociado al usuario autenticado.',
            ]);
        }

        $isAssigned = TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('course_id', $courseId)
            ->where('section_id', (string) $section->id)
            ->where('academic_year_id', (string) $academicYear->id)
            ->where('is_active', true)
            ->exists();

        if (!$isAssigned) {
            throw ValidationException::withMessages([
                'assignment' => 'No tienes una asignacion activa para consultar esta seccion y curso.',
            ]);
        }
    }
}
