<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\DescriptiveConclusion;
use App\Models\Evaluation;
use App\Models\FinalCompetencyResult;
use App\Models\FinalCourseGrade;
use App\Models\GradeLevel;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\PromotionRule;
use App\Models\RecoveryProcess;
use App\Models\RecoveryResult;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentFinalStatus;
use App\Models\VacationalSchool;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AcademicEvaluationService
{
    private const LEVEL_ORDER = [
        'C' => 1,
        'B' => 2,
        'A' => 3,
        'AD' => 4,
    ];

    // Valor numerico representativo de cada letra EBR = punto medio del
    // rango real ya usado en el frontend (sistema-educativo-frontend/src/app/
    // shared/utils/grade-converter.ts, EBR_SCALE: AD 18-20, A 14-17, B 11-13,
    // C 0-10). Se usa SOLO para promediar competencias y obtener la nota de
    // curso — no se muestra al usuario, no reemplaza la nota real por
    // competencia.
    private const EBR_MIDPOINTS = [
        'AD' => 19.0,
        'A' => 15.5,
        'B' => 12.0,
        'C' => 5.0,
    ];

    // Umbral de cursos con nota final C que decide Escuela Vacacional (NO
    // repite, cursos pendientes) vs repitencia (repite el año completo).
    // Regla de negocio confirmada: 0 cursos en C -> promociona; 1 a
    // VACATIONAL_MAX_COURSES cursos en C -> vacacional; mas que eso -> repite.
    private const VACATIONAL_MAX_COURSES = 3;

    public function recalculateStudentYear(Student $student, AcademicYear $academicYear, ?string $requestedBy = null): array
    {
        $gradeLevel = $this->resolveGradeLevel($student, $academicYear);

        if (!$gradeLevel) {
            throw ValidationException::withMessages([
                'student_id' => 'No se pudo determinar el grado del estudiante para el año académico indicado.',
            ]);
        }

        $evaluations = $this->loadYearEvaluations($student, $academicYear);
        $finalResults = $this->persistFinalResults($student, $academicYear, $evaluations);
        $courseGrades = $this->persistFinalCourseGrades($student, $academicYear, $finalResults);

        // Motor generico configurable por PromotionRule: se conserva intacto
        // y se sigue exponiendo en el resumen (por si sirve para otra
        // finalidad a futuro), pero YA NO decide el final_status persistido
        // — eso ahora lo hace calculateCourseBasedDecision() con la regla
        // fija de negocio (conteo de cursos en C), ver mas abajo.
        $rule = $this->resolvePromotionRule($gradeLevel);

        $decision = $this->calculateCourseBasedDecision($courseGrades);
        $nextGrade = $this->resolveNextGradeAssignment($gradeLevel, $decision['final_status']);
        $finalStatus = $this->persistFinalStatus($student, $academicYear, $gradeLevel, $decision, $requestedBy, $nextGrade);

        $coursesInC = $courseGrades->where('final_level', 'C');
        $existingVacationalCourseIds = VacationalSchool::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->pluck('course_id')
            ->map(fn ($id) => (string) $id)
            ->all();

        $this->syncVacationalSchool($student, $academicYear, $coursesInC);

        // Solo se notifica por los cursos NUEVOS que caen en vacacional en
        // este recalculo — si el admin/docente presiona "Recalcular" varias
        // veces sin que cambien los cursos en C, no se reenvia el aviso.
        if ($decision['final_status'] === 'vacacional') {
            $newCourseIds = array_diff(
                $coursesInC->pluck('course_id')->map(fn ($id) => (string) $id)->all(),
                $existingVacationalCourseIds
            );

            if ($newCourseIds !== []) {
                $newlyAssigned = $coursesInC->filter(
                    fn (FinalCourseGrade $grade) => in_array((string) $grade->course_id, $newCourseIds, true)
                );
                $this->dispatchVacationalNotifications($student, $newlyAssigned, $requestedBy);
            }
        }

        return $this->getStudentYearSummary($student, $academicYear, $gradeLevel, $rule, $finalStatus, null);
    }

    public function getStudentYearSummary(
        Student $student,
        AcademicYear $academicYear,
        ?GradeLevel $gradeLevel = null,
        ?PromotionRule $rule = null,
        ?StudentFinalStatus $finalStatus = null,
        ?RecoveryProcess $recoveryProcess = null
    ): array {
        $gradeLevel ??= $this->resolveGradeLevel($student, $academicYear);
        $rule ??= $gradeLevel ? $this->resolvePromotionRule($gradeLevel) : null;
        $finalStatus ??= StudentFinalStatus::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->first();
        $recoveryProcess ??= RecoveryProcess::query()
            ->with(['results.competency', 'results.course'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->latest('updated_at')
            ->first();

        $finalResults = FinalCompetencyResult::query()
            ->with(['course', 'competency', 'sourcePeriod'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->orderBy('course_id')
            ->orderBy('competency_id')
            ->get();

        $conclusions = DescriptiveConclusion::query()
            ->with(['competency', 'period'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->orderBy('period_id')
            ->get();

        $enrolledCourses = $this->loadEnrolledCourses($student, $academicYear);

        $courseGrades = FinalCourseGrade::query()
            ->with('course')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->get();

        $vacationalCourses = VacationalSchool::query()
            ->with('course')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->get();

        return [
            'student' => [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'student_code' => $student->student_code,
            ],
            'academic_year' => [
                'id' => $academicYear->id,
                'year' => $academicYear->year,
            ],
            'grade_level' => $gradeLevel ? [
                'id' => $gradeLevel->id,
                'level' => $gradeLevel->level,
                'grade' => $gradeLevel->grade,
                'name' => $gradeLevel->name,
            ] : null,
            'rule' => $rule,
            'totals' => [
                'competencies' => $finalResults->count(),
                'ad' => $finalResults->where('final_level', 'AD')->count(),
                'a' => $finalResults->where('final_level', 'A')->count(),
                'b' => $finalResults->where('final_level', 'B')->count(),
                'c' => $finalResults->where('final_level', 'C')->count(),
            ],
            'enrolled_courses' => $enrolledCourses,
            'areas' => array_values($this->buildAreaSummaries($finalResults)),
            'final_results' => $finalResults->values(),
            'course_grades' => $courseGrades->values(),
            'vacational_courses' => $vacationalCourses->values(),
            'descriptive_conclusions' => $conclusions,
            'student_final_status' => $finalStatus,
            'recovery_process' => $recoveryProcess,
        ];
    }

    public function recalculateSection(Section $section, AcademicYear $academicYear, ?string $requestedBy = null): array
    {
        $students = Student::query()
            ->where('section_id', $section->id)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $results = [];
        foreach ($students as $student) {
            $results[] = $this->recalculateStudentYear($student, $academicYear, $requestedBy);
        }

        return [
            'section_id' => $section->id,
            'academic_year_id' => $academicYear->id,
            'processed_students' => count($results),
            'results' => $results,
        ];
    }

    public function getSectionDashboard(Section $section, AcademicYear $academicYear, array $filters = []): array
    {
        $courseId = $this->normalizeUuidFilter($filters['course_id'] ?? null, 'course_id');
        $periodId = $this->normalizeUuidFilter($filters['period_id'] ?? null, 'period_id');
        $competencyId = $this->normalizeUuidFilter($filters['competency_id'] ?? null, 'competency_id');

        $enrollments = StudentCourseEnrollment::query()
            ->with(['student', 'section.gradeLevel'])
            ->where('section_id', $section->id)
            ->where('academic_year_id', $academicYear->id)
            ->where('status', 'active')
            ->when($courseId, fn ($query) => $query->where('course_id', $courseId))
            ->get()
            ->filter(fn (StudentCourseEnrollment $enrollment) => $enrollment->student)
            ->sortBy(fn (StudentCourseEnrollment $enrollment) => sprintf(
                '%s %s',
                $enrollment->student->last_name ?? '',
                $enrollment->student->first_name ?? ''
            ))
            ->values();

        $students = $enrollments
            ->map(fn (StudentCourseEnrollment $enrollment) => $enrollment->student)
            ->unique('id')
            ->values();

        $studentIds = $students->pluck('id')->all();

        if ($studentIds === []) {
            return [
                'section' => [
                    'id' => $section->id,
                    'label' => trim(($section->gradeLevel?->name ?? '') . ' ' . ($section->section_letter ?? '')),
                ],
                'filters' => [
                    'course_id' => $courseId,
                    'period_id' => $periodId,
                    'competency_id' => $competencyId,
                ],
                'stats' => [
                    'students' => 0,
                    'graded' => 0,
                    'published' => 0,
                    'current_risk' => 0,
                    'status_breakdown' => [
                        'promociona' => 0,
                        'vacacional' => 0,
                        'recuperacion' => 0,
                        'permanece' => 0,
                        'pendiente' => 0,
                    ],
                ],
                'students' => [],
            ];
        }

        $currentEvaluations = Evaluation::query()
            ->whereIn('student_id', $studentIds)
            ->when($courseId, fn ($query) => $query->where('course_id', $courseId))
            ->when($periodId, fn ($query) => $query->where('period_id', $periodId))
            ->when($competencyId, fn ($query) => $query->where('competency_id', $competencyId))
            ->get()
            ->keyBy('student_id');

        $finalResultsByStudent = FinalCompetencyResult::query()
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $academicYear->id)
            ->when($courseId, fn ($query) => $query->where('course_id', $courseId))
            ->get()
            ->groupBy('student_id');

        $finalStatuses = StudentFinalStatus::query()
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $academicYear->id)
            ->get()
            ->keyBy('student_id');

        $recoveryProcesses = RecoveryProcess::query()
            ->withCount('results')
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $academicYear->id)
            ->orderByDesc('updated_at')
            ->get()
            ->groupBy('student_id')
            ->map(fn (Collection $items) => $items->first());

        $conclusionsByStudent = DescriptiveConclusion::query()
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $academicYear->id)
            ->when($periodId, fn ($query) => $query->where('period_id', $periodId))
            ->when($competencyId, fn ($query) => $query->where('competency_id', $competencyId))
            ->orderByDesc('updated_at')
            ->get()
            ->groupBy('student_id');

        $statusBreakdown = [
            'promociona' => 0,
            'vacacional' => 0,
            'recuperacion' => 0,
            'permanece' => 0,
            'pendiente' => 0,
        ];

        $mappedStudents = $students->map(function (Student $student) use (
            $currentEvaluations,
            $finalResultsByStudent,
            $finalStatuses,
            $recoveryProcesses,
            $conclusionsByStudent,
            &$statusBreakdown
        ) {
            /** @var Collection $finalResults */
            $finalResults = $finalResultsByStudent->get($student->id, collect());
            $finalStatus = $finalStatuses->get($student->id);
            $recoveryProcess = $recoveryProcesses->get($student->id);
            /** @var Collection $studentConclusions */
            $studentConclusions = $conclusionsByStudent->get($student->id, collect());
            $currentEvaluation = $currentEvaluations->get($student->id);

            $statusKey = $finalStatus?->final_status ?: 'pendiente';
            if (!array_key_exists($statusKey, $statusBreakdown)) {
                $statusKey = 'pendiente';
            }
            $statusBreakdown[$statusKey]++;

            return [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'student_code' => $student->student_code,
                'section_id' => $student->section_id,
                'current_evaluation' => $currentEvaluation ? [
                    'id' => $currentEvaluation->id,
                    'grade' => $currentEvaluation->grade,
                    'observations' => $currentEvaluation->observations,
                    'status' => $currentEvaluation->status,
                    'published_at' => $currentEvaluation->published_at,
                ] : null,
                'academic_summary' => [
                    'final_status' => $statusKey,
                    'pending_competencies_count' => $finalStatus?->pending_competencies_count ?? 0,
                    'recovery_required' => (bool) ($finalStatus?->recovery_required ?? false),
                    'totals' => [
                        'competencies' => $finalResults->count(),
                        'ad' => $finalResults->where('final_level', 'AD')->count(),
                        'a' => $finalResults->where('final_level', 'A')->count(),
                        'b' => $finalResults->where('final_level', 'B')->count(),
                        'c' => $finalResults->where('final_level', 'C')->count(),
                    ],
                    'recovery_process' => $recoveryProcess ? [
                        'id' => $recoveryProcess->id,
                        'status' => $recoveryProcess->status,
                        'results_count' => $recoveryProcess->results_count,
                    ] : null,
                    'descriptive_conclusions' => $studentConclusions->map(function (DescriptiveConclusion $conclusion) {
                        return [
                            'id' => $conclusion->id,
                            'competency_id' => $conclusion->competency_id,
                            'period_id' => $conclusion->period_id,
                            'conclusion_text' => $conclusion->conclusion_text,
                            'recommendations' => $conclusion->recommendations,
                        ];
                    })->values(),
                ],
            ];
        })->values();

        return [
            'section' => [
                'id' => $section->id,
                'label' => trim(($section->gradeLevel?->name ?? '') . ' ' . ($section->section_letter ?? '')),
            ],
            'filters' => [
                'course_id' => $courseId,
                'period_id' => $periodId,
                'competency_id' => $competencyId,
            ],
            'stats' => [
                'students' => $mappedStudents->count(),
                'graded' => $mappedStudents->filter(fn (array $student) => !empty($student['current_evaluation']['grade']))->count(),
                'published' => $mappedStudents->filter(fn (array $student) => ($student['current_evaluation']['status'] ?? null) === 'publicada')->count(),
                'current_risk' => $mappedStudents->filter(fn (array $student) => in_array($student['current_evaluation']['grade'] ?? null, ['B', 'C'], true))->count(),
                'status_breakdown' => $statusBreakdown,
            ],
            'students' => $mappedStudents,
        ];
    }

    private function resolveGradeLevel(Student $student, AcademicYear $academicYear): ?GradeLevel
    {
        if ($student->section_id) {
            $section = Section::query()->with('gradeLevel')->find($student->section_id);

            if ($section?->gradeLevel) {
                return $section->gradeLevel;
            }
        }

        $enrollment = StudentCourseEnrollment::query()
            ->with('section.gradeLevel')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->latest('enrollment_date')
            ->first();

        return $enrollment?->section?->gradeLevel;
    }

    private function loadYearEvaluations(Student $student, AcademicYear $academicYear): Collection
    {
        return Evaluation::query()
            ->with(['period', 'course', 'competency'])
            ->where('student_id', $student->id)
            ->whereHas('period', function ($query) use ($academicYear) {
                $query->where('academic_year_id', $academicYear->id);
            })
            ->get()
            ->sortBy(function (Evaluation $evaluation) {
                $periodNumber = $evaluation->period?->period_number ?? 999;
                $updatedAt = $evaluation->updated_at?->timestamp ?? 0;

                return sprintf('%05d-%020d', $periodNumber, $updatedAt);
            })
            ->values();
    }

    private function persistFinalResults(Student $student, AcademicYear $academicYear, Collection $evaluations): Collection
    {
        $persistedIds = [];

        foreach ($evaluations->groupBy('competency_id') as $competencyId => $rows) {
            $ordered = $rows->values();
            $selected = $ordered
                ->filter(fn (Evaluation $evaluation) => in_array($evaluation->status, ['publicada', 'cerrada'], true))
                ->last() ?? $ordered->last();

            if (!$selected) {
                continue;
            }

            $result = FinalCompetencyResult::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'competency_id' => $competencyId,
                    'academic_year_id' => $academicYear->id,
                ],
                [
                    'course_id' => $selected->course_id,
                    'source_period_id' => $selected->period_id,
                    'final_level' => $selected->grade,
                    'current_status' => $selected->status ?? 'borrador',
                    'requires_support' => in_array($selected->grade, ['B', 'C'], true) || $this->hasConsecutiveC($ordered),
                    'has_consecutive_c' => $this->hasConsecutiveC($ordered),
                    'evidence_note' => $selected->observations ?? $selected->comments,
                ]
            );

            $persistedIds[] = $result->id;
        }

        FinalCompetencyResult::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->when($persistedIds !== [], function ($query) use ($persistedIds) {
                $query->whereNotIn('id', $persistedIds);
            })
            ->delete();

        return FinalCompetencyResult::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->get();
    }

    private function hasConsecutiveC(Collection $orderedEvaluations): bool
    {
        $lastWasC = false;

        foreach ($orderedEvaluations as $evaluation) {
            if ($evaluation->grade === 'C') {
                if ($lastWasC) {
                    return true;
                }

                $lastWasC = true;
                continue;
            }

            $lastWasC = false;
        }

        return false;
    }

    private function resolvePromotionRule(GradeLevel $gradeLevel): ?PromotionRule
    {
        return PromotionRule::query()
            ->where('active', true)
            ->where('education_level', strtolower($gradeLevel->level))
            ->where(function ($query) use ($gradeLevel) {
                $query->whereNull('grade_number')
                    ->orWhere('grade_number', $gradeLevel->grade);
            })
            ->orderByRaw('CASE WHEN grade_number IS NULL THEN 1 ELSE 0 END')
            ->first();
    }

    private function calculateDecision(?PromotionRule $rule, Collection $finalResults): array
    {
        if ($finalResults->isEmpty()) {
            return [
                'final_status' => 'pendiente',
                'pending_competencies_count' => 0,
                'recovery_required' => false,
                'decision_reason' => 'No existen resultados finales por competencia para el año académico.',
            ];
        }

        if (!$rule) {
            return [
                'final_status' => 'pendiente',
                'pending_competencies_count' => $finalResults->whereIn('final_level', ['B', 'C'])->count(),
                'recovery_required' => false,
                'decision_reason' => 'No existe una regla de promoción activa para este grado.',
            ];
        }

        if ($this->matchesPermanenceRule($rule, $finalResults)) {
            return [
                'final_status' => 'permanece',
                'pending_competencies_count' => $finalResults->where('final_level', 'C')->count(),
                'recovery_required' => false,
                'decision_reason' => 'El estudiante cumple la condición de permanencia definida por la regla activa.',
            ];
        }

        if ($this->matchesPromotionRule($rule, $finalResults)) {
            return [
                'final_status' => 'promociona',
                'pending_competencies_count' => $finalResults->whereIn('final_level', ['B', 'C'])->count(),
                'recovery_required' => false,
                'decision_reason' => 'El estudiante cumple los criterios de promoción definidos por la regla activa.',
            ];
        }

        return [
            'final_status' => 'recuperacion',
            'pending_competencies_count' => $finalResults->whereIn('final_level', ['B', 'C'])->count(),
            'recovery_required' => true,
            'decision_reason' => 'El estudiante no cumple promoción ni permanencia; requiere recuperación pedagógica.',
        ];
    }

    private function matchesPromotionRule(PromotionRule $rule, Collection $finalResults): bool
    {
        return match ($rule->promotion_mode) {
            'direct_promotion' => true,
            'aad_half_in_n_areas_rest_b' => $this->matchesAadHalfInAreasRule($rule, $finalResults),
            default => $this->matchesMinimumBHalfRule($finalResults),
        };
    }

    private function matchesMinimumBHalfRule(Collection $finalResults): bool
    {
        $minimumBOrBetter = $finalResults->filter(function (FinalCompetencyResult $result) {
            return $this->levelValue($result->final_level) >= $this->levelValue('B');
        })->count();

        return $minimumBOrBetter >= (int) ceil($finalResults->count() / 2);
    }

    private function matchesAadHalfInAreasRule(PromotionRule $rule, Collection $finalResults): bool
    {
        $areas = $this->buildAreaSummaries($finalResults);
        $requiredAreas = $rule->promotion_area_count ?? 0;
        $minimumRemaining = $rule->minimum_level_for_remaining_competencies ?: 'B';
        $areasMeetingPromotion = 0;
        $allCompetenciesMeetFloor = true;

        foreach ($areas as $area) {
            if ($area['aad_count'] >= (int) ceil($area['total'] / 2)) {
                $areasMeetingPromotion++;
            }

            if ($area['min_level_value'] < $this->levelValue($minimumRemaining)) {
                $allCompetenciesMeetFloor = false;
            }
        }

        return $areasMeetingPromotion >= $requiredAreas && $allCompetenciesMeetFloor;
    }

    private function matchesPermanenceRule(PromotionRule $rule, Collection $finalResults): bool
    {
        if ($rule->permanence_mode === 'none') {
            return false;
        }

        $areasWithCriticalC = 0;
        foreach ($this->buildAreaSummaries($finalResults) as $area) {
            if ($area['c_count'] > ($area['total'] / 2)) {
                $areasWithCriticalC++;
            }
        }

        return $areasWithCriticalC >= ($rule->permanence_area_count ?? PHP_INT_MAX);
    }

    private function buildAreaSummaries(Collection $finalResults): array
    {
        return $finalResults
            ->groupBy('course_id')
            ->map(function (Collection $rows, string $courseId) {
                $levels = $rows->pluck('final_level');

                return [
                    'course_id' => $courseId,
                    'course_name' => $rows->first()?->course?->name,
                    'total' => $rows->count(),
                    'ad_count' => $levels->filter(fn ($level) => $level === 'AD')->count(),
                    'a_count' => $levels->filter(fn ($level) => $level === 'A')->count(),
                    'b_count' => $levels->filter(fn ($level) => $level === 'B')->count(),
                    'c_count' => $levels->filter(fn ($level) => $level === 'C')->count(),
                    'aad_count' => $levels->filter(fn ($level) => in_array($level, ['AD', 'A'], true))->count(),
                    'min_level_value' => $levels
                        ->map(fn ($level) => $this->levelValue($level))
                        ->min() ?? 0,
                ];
            })
            ->values()
            ->all();
    }

    private function loadEnrolledCourses(Student $student, AcademicYear $academicYear): array
    {
        return StudentCourseEnrollment::query()
            ->with('course')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->where('status', 'active')
            ->get()
            ->filter(fn (StudentCourseEnrollment $enrollment) => $enrollment->course)
            ->unique('course_id')
            ->sortBy(fn (StudentCourseEnrollment $enrollment) => $enrollment->course?->name ?? '')
            ->values()
            ->map(fn (StudentCourseEnrollment $enrollment) => [
                'id' => $enrollment->course->id,
                'code' => $enrollment->course->code,
                'name' => $enrollment->course->name,
            ])
            ->all();
    }

    private function persistFinalStatus(
        Student $student,
        AcademicYear $academicYear,
        GradeLevel $gradeLevel,
        array $decision,
        ?string $requestedBy = null,
        array $nextGrade = ['next_grade_level_id' => null, 'is_graduating' => false]
    ): StudentFinalStatus {
        return StudentFinalStatus::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_year_id' => $academicYear->id,
            ],
            [
                'grade_level_id' => $gradeLevel->id,
                'final_status' => $decision['final_status'],
                'pending_competencies_count' => $decision['pending_competencies_count'],
                'recovery_required' => $decision['recovery_required'],
                'decision_reason' => $decision['decision_reason'],
                'decided_by' => $requestedBy,
                'decided_at' => now(),
                'next_grade_level_id' => $nextGrade['next_grade_level_id'],
                'is_graduating' => $nextGrade['is_graduating'],
            ]
        );
    }

    // ------------------------------------------------------------------
    // Promocion de año (Escuela Vacacional / repitencia) — regla fija de
    // negocio, PARALELA al motor generico PromotionRule de mas arriba
    // (calculateDecision/matchesPromotionRule/matchesPermanenceRule), que
    // se deja intacto sin usar para no romper nada que dependa de el.
    // ------------------------------------------------------------------

    private function persistFinalCourseGrades(Student $student, AcademicYear $academicYear, Collection $finalResults): Collection
    {
        $persistedIds = [];

        foreach ($finalResults->groupBy('course_id') as $courseId => $competencyResults) {
            $grade = $this->calculateCourseGrade($competencyResults);

            $row = FinalCourseGrade::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'course_id' => $courseId,
                    'academic_year_id' => $academicYear->id,
                ],
                [
                    'average_score' => $grade['average_score'],
                    'final_level' => $grade['final_level'],
                ]
            );

            $persistedIds[] = $row->id;
        }

        FinalCourseGrade::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->when($persistedIds !== [], function ($query) use ($persistedIds) {
                $query->whereNotIn('id', $persistedIds);
            })
            ->delete();

        return FinalCourseGrade::query()
            ->with('course')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->get();
    }

    /**
     * Nota final de un curso = promedio numerico de sus competencias,
     * convertido de vuelta a letra EBR. Cada letra se representa por el
     * PUNTO MEDIO de su rango real (self::EBR_MIDPOINTS) porque es el valor
     * mas neutral posible: no favorece el extremo alto ni el bajo del rango
     * de cada competencia individual al promediar varias.
     */
    private function calculateCourseGrade(Collection $competencyResults): array
    {
        $scores = $competencyResults->map(
            fn (FinalCompetencyResult $result) => self::EBR_MIDPOINTS[$result->final_level] ?? self::EBR_MIDPOINTS['C']
        );

        $average = round((float) $scores->avg(), 2);

        return [
            'average_score' => $average,
            'final_level' => $this->numberToEbr($average),
        ];
    }

    // Mismos rangos que EBR_SCALE del frontend (grade-converter.ts):
    // AD 18-20, A 14-17, B 11-13, C 0-10.
    private function numberToEbr(float $score): string
    {
        if ($score >= 18) {
            return 'AD';
        }

        if ($score >= 14) {
            return 'A';
        }

        if ($score >= 11) {
            return 'B';
        }

        return 'C';
    }

    /**
     * Regla de negocio fija (NO configurable via PromotionRule):
     *  - 0 cursos en C -> promociona.
     *  - 1 a VACATIONAL_MAX_COURSES cursos en C -> vacacional (promociona
     *    igual, pero con esos cursos pendientes en Escuela Vacacional).
     *  - mas de VACATIONAL_MAX_COURSES cursos en C -> permanece (repite el
     *    año completo).
     * 'vacacional' es un final_status SEPARADO de 'promociona' — aunque el
     * estudiante SI sube de grado en ambos casos, se distingue para que el
     * dashboard y las notificaciones identifiquen quien tiene cursos
     * pendientes sin cruzar contra vacational_school cada vez.
     */
    private function calculateCourseBasedDecision(Collection $courseGrades): array
    {
        if ($courseGrades->isEmpty()) {
            return [
                'final_status' => 'pendiente',
                'pending_competencies_count' => 0,
                'recovery_required' => false,
                'decision_reason' => 'No existen cursos con nota final consolidada para el año académico.',
            ];
        }

        $coursesInC = $courseGrades->where('final_level', 'C')->count();

        if ($coursesInC === 0) {
            return [
                'final_status' => 'promociona',
                'pending_competencies_count' => 0,
                'recovery_required' => false,
                'decision_reason' => 'El estudiante aprobó (AD/A/B) todos sus cursos.',
            ];
        }

        if ($coursesInC <= self::VACATIONAL_MAX_COURSES) {
            return [
                'final_status' => 'vacacional',
                'pending_competencies_count' => $coursesInC,
                'recovery_required' => true,
                'decision_reason' => "El estudiante desaprobó (C) {$coursesInC} curso(s); promociona con esos cursos pendientes en Escuela Vacacional.",
            ];
        }

        return [
            'final_status' => 'permanece',
            'pending_competencies_count' => $coursesInC,
            'recovery_required' => false,
            'decision_reason' => 'El estudiante desaprobó (C) ' . $coursesInC . ' cursos (más de ' . self::VACATIONAL_MAX_COURSES . '); repite el año completo.',
        ];
    }

    /**
     * A que grado queda asignado el estudiante el PROXIMO año academico.
     *  - 'permanece' -> el MISMO grado actual (repite).
     *  - 'promociona' / 'vacacional' -> grade_levels.next_grade_level_id del
     *    grado actual; si es null (5to Secundaria aprobado) es egreso, no
     *    repitencia — se marca is_graduating=true en vez de asignar grado.
     *  - cualquier otro estado (pendiente): sin decision de grado todavia.
     */
    private function resolveNextGradeAssignment(GradeLevel $gradeLevel, string $status): array
    {
        if ($status === 'permanece') {
            return ['next_grade_level_id' => $gradeLevel->id, 'is_graduating' => false];
        }

        if (in_array($status, ['promociona', 'vacacional'], true)) {
            $nextId = $gradeLevel->next_grade_level_id;

            return [
                'next_grade_level_id' => $nextId,
                'is_graduating' => $nextId === null,
            ];
        }

        return ['next_grade_level_id' => null, 'is_graduating' => false];
    }

    private function syncVacationalSchool(Student $student, AcademicYear $academicYear, Collection $coursesInC): void
    {
        $persistedIds = [];

        foreach ($coursesInC as $courseGrade) {
            $row = VacationalSchool::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'academic_year_id' => $academicYear->id,
                    'course_id' => $courseGrade->course_id,
                ],
                [
                    // No se incluye 'status' aca a proposito: si la fila ya
                    // existia y estaba 'completado', un recalculo posterior
                    // no debe reabrirla a 'pendiente'. Las filas nuevas usan
                    // el default de la columna ('pendiente').
                    'final_grade' => $courseGrade->final_level,
                ]
            );

            $persistedIds[] = $row->id;
        }

        // Limpia solo lo que ya no corresponda de ESTE alumno/año (el curso
        // dejo de estar en C en un recalculo posterior) — nunca toca otros
        // años ni otros alumnos.
        VacationalSchool::query()
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->when($persistedIds !== [], function ($query) use ($persistedIds) {
                $query->whereNotIn('id', $persistedIds);
            })
            ->delete();
    }

    /**
     * Reutiliza EXACTAMENTE el patron ya construido para Tutoria Academica
     * (MessageController::createTutoriaRecipients/dispatchTutoriaNotifications):
     * un Message ancla (category='vacacional'), un MessageRecipient por
     * estudiante y por cada apoderado vinculado, y una Notification por
     * cada uno con type='vacacional_asignado'.
     */
    private function dispatchVacationalNotifications(Student $student, Collection $newlyAssignedCourses, ?string $requestedBy): void
    {
        if ($newlyAssignedCourses->isEmpty()) {
            return;
        }

        $senderProfile = $requestedBy
            ? Profile::query()->where('user_id', $requestedBy)->first()
            : null;

        if (!$senderProfile) {
            Log::warning('AcademicEvaluationService: no se pudo resolver un profile emisor para el aviso de Escuela Vacacional, se omite el mensaje.', [
                'student_id' => $student->id,
                'requested_by' => $requestedBy,
            ]);

            return;
        }

        $courseNames = $newlyAssignedCourses
            ->map(fn (FinalCourseGrade $grade) => $grade->course?->name ?? 'Curso')
            ->implode(', ');

        $message = Message::create([
            'student_id' => $student->id,
            // Aviso institucional automatico, no de un docente puntual;
            // mismo criterio de normalizacion que
            // MessageController::resolvePersistedSenderRole (el constraint
            // de BD solo permite 'teacher'/'guardian').
            'sender_role' => 'teacher',
            'sender_id' => $senderProfile->id,
            'content' => "El estudiante {$student->full_name} desaprobó (C) los siguientes cursos y deberá recuperarlos en Escuela Vacacional: {$courseNames}.",
            'is_read' => false,
            'category' => 'vacacional',
            'title' => 'Cursos asignados a Escuela Vacacional',
            'created_at' => now(),
        ]);

        $recipients = collect();

        if ($student->user_id) {
            $recipients->push(MessageRecipient::create([
                'message_id' => $message->id,
                'recipient_type' => 'student',
                'recipient_user_id' => $student->user_id,
                'created_at' => now(),
            ]));
        }

        $student->guardians()
            ->whereNotNull('guardians.user_id')
            ->get()
            ->unique('user_id')
            ->each(function ($guardian) use ($message, $recipients) {
                $recipients->push(MessageRecipient::create([
                    'message_id' => $message->id,
                    'recipient_type' => 'guardian',
                    'recipient_user_id' => $guardian->user_id,
                    'created_at' => now(),
                ]));
            });

        $notificationColumns = [
            'title' => Schema::hasColumn('notifications', 'title'),
            'message' => Schema::hasColumn('notifications', 'message'),
        ];

        $recipients->each(function (MessageRecipient $recipient) use ($courseNames, $notificationColumns) {
            $payload = [
                'user_id' => (string) $recipient->recipient_user_id,
                'type' => 'vacacional_asignado',
                'status' => 'no_leida',
            ];

            if ($notificationColumns['title']) {
                $payload['title'] = 'Cursos asignados a Escuela Vacacional';
            }

            if ($notificationColumns['message']) {
                $payload['message'] = Str::limit("Cursos pendientes: {$courseNames}.", 140);
            }

            Notification::create($payload);
        });
    }

    private function syncRecoveryProcess(
        Student $student,
        AcademicYear $academicYear,
        GradeLevel $gradeLevel,
        Collection $finalResults,
        array $decision,
        ?string $requestedBy = null
    ): ?RecoveryProcess {
        if (!$decision['recovery_required']) {
            return RecoveryProcess::query()
                ->with(['results.competency', 'results.course'])
                ->where('student_id', $student->id)
                ->where('academic_year_id', $academicYear->id)
                ->latest('updated_at')
                ->first();
        }

        $recoveryProcess = RecoveryProcess::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_year_id' => $academicYear->id,
                'grade_level_id' => $gradeLevel->id,
            ],
            [
                'status' => 'pending',
                'referral_reason' => $decision['decision_reason'],
                'support_plan' => 'Reforzar competencias con nivel B/C y seguimiento pedagógico.',
                'started_at' => now()->toDateString(),
                'created_by' => $requestedBy,
                'updated_by' => $requestedBy,
            ]
        );

        $persistedIds = [];
        foreach ($finalResults as $result) {
            if (!in_array($result->final_level, ['B', 'C'], true) && !$result->has_consecutive_c) {
                continue;
            }

            $recoveryResult = RecoveryResult::updateOrCreate(
                [
                    'recovery_process_id' => $recoveryProcess->id,
                    'competency_id' => $result->competency_id,
                ],
                [
                    'course_id' => $result->course_id,
                    'initial_level' => $result->final_level,
                    'final_level' => $result->final_level,
                    'is_resolved' => false,
                    'observations' => $result->evidence_note,
                ]
            );

            $persistedIds[] = $recoveryResult->id;
        }

        RecoveryResult::query()
            ->where('recovery_process_id', $recoveryProcess->id)
            ->when($persistedIds !== [], function ($query) use ($persistedIds) {
                $query->whereNotIn('id', $persistedIds);
            })
            ->delete();

        return $recoveryProcess->fresh(['results.competency', 'results.course']);
    }

    private function levelValue(?string $level): int
    {
        return self::LEVEL_ORDER[$level ?? 'C'] ?? 0;
    }

    private function normalizeUuidFilter(mixed $value, string $field): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $stringValue = (string) $value;

        if (Str::isUuid($stringValue)) {
            return $stringValue;
        }

        Log::warning('AcademicEvaluationService ignored invalid UUID filter', [
            'field' => $field,
            'value' => $stringValue,
        ]);

        return null;
    }
}
