<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\DescriptiveConclusion;
use App\Models\Evaluation;
use App\Models\FinalCompetencyResult;
use App\Models\GradeLevel;
use App\Models\PromotionRule;
use App\Models\RecoveryProcess;
use App\Models\RecoveryResult;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentFinalStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
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
        $rule = $this->resolvePromotionRule($gradeLevel);
        $decision = $this->calculateDecision($rule, $finalResults);
        $finalStatus = $this->persistFinalStatus($student, $academicYear, $gradeLevel, $decision, $requestedBy);
        $recoveryProcess = $this->syncRecoveryProcess($student, $academicYear, $gradeLevel, $finalResults, $decision, $requestedBy);

        return $this->getStudentYearSummary($student, $academicYear, $gradeLevel, $rule, $finalStatus, $recoveryProcess);
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
                    'comments' => $currentEvaluation->observations ?? $currentEvaluation->comments,
                    'status' => $currentEvaluation->status,
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
        ?string $requestedBy = null
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
            ]
        );
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
