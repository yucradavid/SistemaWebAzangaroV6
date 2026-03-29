<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ReportController extends Controller
{
    /**
     * BOLETA / REPORTE DE NOTAS
     * GET /api/reports/students/{student}/report-card?period_id=UUID
     */
    public function reportCard(Student $student, Request $request)
    {
        $periodId = $request->query('period_id');
        $role = $request->user()?->profile?->role;
        $commentsColumn = Schema::hasColumn('evaluations', 'observations') ? 'observations' : 'comments';
        $competencyLabelColumn = Schema::hasColumn('competencies', 'name') ? 'name' : 'description';
        $academicYearId = $periodId
            ? DB::table('periods')->where('id', $periodId)->value('academic_year_id')
            : DB::table('academic_years')->where('is_active', true)->value('id');

        $q = DB::table('evaluations as e')
            ->join('courses as c', 'c.id', '=', 'e.course_id')
            ->join('competencies as comp', 'comp.id', '=', 'e.competency_id')
            ->join('periods as p', 'p.id', '=', 'e.period_id')
            ->select([
                'e.id',
                'e.student_id',
                'e.course_id',
                'c.name as course_name',
                'c.code as course_code',
                'e.competency_id',
                DB::raw("COALESCE(comp.{$competencyLabelColumn}, '') as competency_name"),
                'e.period_id',
                'p.name as period_name',
                'e.grade',
                'e.status',
                DB::raw("COALESCE(e.{$commentsColumn},'') as comments"),
                'e.created_at',
            ])
            ->where('e.student_id', $student->id);

        if (in_array($role, ['student', 'guardian'], true)) {
            $q->whereIn('e.status', ['publicada', 'cerrada']);
        }

        if ($periodId) {
            $q->where('e.period_id', $periodId);
        }

        $rows = $q->orderBy('c.name')
            ->orderBy("comp.{$competencyLabelColumn}")
            ->get();

        // Agrupar: Curso -> Competencias
        $grouped = [];
        $enrolledCourses = StudentCourseEnrollment::query()
            ->with('course')
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->when($academicYearId, fn ($query) => $query->where('academic_year_id', $academicYearId))
            ->get()
            ->filter(fn (StudentCourseEnrollment $enrollment) => $enrollment->course)
            ->unique('course_id')
            ->sortBy(fn (StudentCourseEnrollment $enrollment) => $enrollment->course?->name ?? '')
            ->values();

        foreach ($enrolledCourses as $enrollment) {
            $grouped[$enrollment->course_id] = [
                'course_id' => $enrollment->course->id,
                'course_name' => $enrollment->course->name,
                'course_code' => $enrollment->course->code,
                'period_id' => $periodId,
                'period_name' => null,
                'competencies' => [],
            ];
        }

        foreach ($rows as $r) {
            $courseKey = $r->course_id;
            if (!isset($grouped[$courseKey])) {
                $grouped[$courseKey] = [
                    'course_id' => $r->course_id,
                    'course_name' => $r->course_name,
                    'course_code' => $r->course_code,
                    'period_id' => $r->period_id,
                    'period_name' => $r->period_name,
                    'competencies' => [],
                ];
            }

            $grouped[$courseKey]['competencies'][] = [
                'evaluation_id' => $r->id,
                'competency_id' => $r->competency_id,
                'competency_name' => $r->competency_name,
                'grade' => $r->grade,          // enum: AD/A/B/C
                'status' => $r->status,        // borrador/publicada/cerrada
                'comments' => $r->comments,
            ];
        }

        return response()->json([
            'student' => [
                'id' => $student->id,
                'full_name' => $student->full_name ?? null,
                'dni' => $student->dni ?? null,
                'student_code' => $student->student_code ?? null,
            ],
            'filters' => [
                'period_id' => $periodId,
            ],
            'report' => array_values($grouped),
        ]);
    }

    /**
     * REPORTE CONSOLIDADO DE ASISTENCIA POR SECCION
     * GET /api/reports/sections/{section}/attendance-summary
     */
    public function sectionAttendanceSummary(Section $section, Request $request)
    {
        $section->loadMissing('gradeLevel');

        $period = $this->resolvePeriod($request->filled('period_id') ? (string) $request->query('period_id') : null);

        $academicYearId = $request->filled('academic_year_id')
            ? (string) $request->query('academic_year_id')
            : (string) ($period->academic_year_id ?? $section->academic_year_id);
        $dateFrom = $request->filled('date_from')
            ? (string) $request->query('date_from')
            : ($period->start_date ?? null);
        $dateTo = $request->filled('date_to')
            ? (string) $request->query('date_to')
            : ($period->end_date ?? null);

        $this->validateSectionAcademicYear($section, $academicYearId);
        $this->validatePeriodAgainstAcademicYear($period, $academicYearId);

        $students = $this->loadSectionStudents($section, $academicYearId);
        $studentIds = array_column($students, 'id');

        if ($studentIds === []) {
            return response()->json([
                'section' => [
                    'id' => $section->id,
                    'label' => $this->buildSectionLabel($section),
                ],
                'filters' => [
                    'academic_year_id' => $academicYearId,
                    'period_id' => $period?->id,
                    'period_name' => $period?->name,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
                'stats' => [
                    'students_count' => 0,
                    'avg_attendance' => 0,
                    'total_absences' => 0,
                    'total_tardies' => 0,
                    'total_justifications' => 0,
                ],
                'rows' => [],
            ]);
        }

        $counts = DB::table('attendance')
            ->select([
                'student_id',
                'status',
                DB::raw('COUNT(*)::int as total'),
            ])
            ->where('section_id', $section->id)
            ->whereIn('student_id', $studentIds)
            ->when($dateFrom, fn ($query) => $query->whereDate('date', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('date', '<=', $dateTo))
            ->groupBy('student_id', 'status')
            ->orderBy('student_id')
            ->get();

        $countsByStudent = [];
        foreach ($counts as $count) {
            $countsByStudent[$count->student_id][$count->status] = (int) $count->total;
        }

        $rows = [];
        $attendanceTotal = 0.0;
        $absencesTotal = 0;
        $tardiesTotal = 0;
        $justificationsTotal = 0;

        foreach ($students as $student) {
            $totals = $countsByStudent[$student['id']] ?? [];
            $present = (int) ($totals['presente'] ?? 0);
            $justified = (int) ($totals['justificado'] ?? 0);
            $absences = (int) ($totals['falta'] ?? 0);
            $tardies = (int) ($totals['tarde'] ?? 0);
            $recordsTotal = $present + $justified + $absences + $tardies;
            $attendancePercentage = $recordsTotal > 0
                ? round((($present + $justified) / $recordsTotal) * 100, 2)
                : 0.0;

            $attendanceTotal += $attendancePercentage;
            $absencesTotal += $absences;
            $tardiesTotal += $tardies;
            $justificationsTotal += $justified;

            $rows[] = [
                'student_id' => $student['id'],
                'student_code' => $student['student_code'],
                'student_name' => $student['full_name'],
                'attendance_percentage' => $attendancePercentage,
                'total_absences' => $absences,
                'total_tardies' => $tardies,
                'total_justifications' => $justified,
            ];
        }

        return response()->json([
            'section' => [
                'id' => $section->id,
                'label' => $this->buildSectionLabel($section),
            ],
            'filters' => [
                'academic_year_id' => $academicYearId,
                'period_id' => $period?->id,
                'period_name' => $period?->name,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'stats' => [
                'students_count' => count($rows),
                'avg_attendance' => count($rows) > 0 ? round($attendanceTotal / count($rows), 2) : 0,
                'total_absences' => $absencesTotal,
                'total_tardies' => $tardiesTotal,
                'total_justifications' => $justificationsTotal,
            ],
            'rows' => $rows,
        ]);
    }

    /**
     * REPORTE CONSOLIDADO DE EVALUACION POR SECCION
     * GET /api/reports/sections/{section}/evaluation-summary
     */
    public function sectionEvaluationSummary(Section $section, Request $request)
    {
        $section->loadMissing('gradeLevel');

        $academicYearId = $request->filled('academic_year_id')
            ? (string) $request->query('academic_year_id')
            : (string) $section->academic_year_id;
        $periodId = $request->filled('period_id') ? (string) $request->query('period_id') : null;
        $courseId = $request->filled('course_id') ? (string) $request->query('course_id') : null;
        $competencyLabelColumn = Schema::hasColumn('competencies', 'name') ? 'name' : 'description';
        $period = $this->resolvePeriod($periodId);

        $this->validateSectionAcademicYear($section, $academicYearId);
        $this->validatePeriodAgainstAcademicYear($period, $academicYearId);
        $this->validateCourseAgainstSection($section, $courseId);

        $students = $this->loadSectionStudents($section, $academicYearId);
        $studentIds = array_column($students, 'id');

        if ($studentIds === []) {
            return response()->json([
                'section' => [
                    'id' => $section->id,
                    'label' => $this->buildSectionLabel($section),
                ],
                'filters' => [
                    'academic_year_id' => $academicYearId,
                    'period_id' => $periodId,
                    'course_id' => $courseId,
                ],
                'stats' => [
                    'students_count' => 0,
                    'students_at_risk' => 0,
                    'grade_distribution' => ['AD' => 0, 'A' => 0, 'B' => 0, 'C' => 0],
                ],
                'competencies' => [],
                'rows' => [],
            ]);
        }

        if ($periodId) {
            $evaluations = DB::table('evaluations as e')
                ->join('competencies as comp', 'comp.id', '=', 'e.competency_id')
                ->join('courses as c', 'c.id', '=', 'e.course_id')
                ->select([
                    'e.student_id',
                    'e.course_id',
                    'e.competency_id',
                    'e.grade',
                    DB::raw("COALESCE(comp.{$competencyLabelColumn}, 'Competencia') as competency_name"),
                    DB::raw("COALESCE(c.name, '') as course_name"),
                ])
                ->whereIn('e.student_id', $studentIds)
                ->where('e.period_id', $periodId)
                ->when($courseId, fn ($query) => $query->where('e.course_id', $courseId))
                ->whereExists(function ($subQuery) use ($section, $academicYearId) {
                    $subQuery->select(DB::raw(1))
                        ->from('student_course_enrollments as sce')
                        ->whereColumn('sce.student_id', 'e.student_id')
                        ->whereColumn('sce.course_id', 'e.course_id')
                        ->where('sce.section_id', $section->id)
                        ->where('sce.academic_year_id', $academicYearId)
                        ->where('sce.status', 'active');
                })
                ->orderBy('c.name')
                ->orderBy("comp.{$competencyLabelColumn}")
                ->get();

            return response()->json(
                $this->buildSectionEvaluationPayload(
                    $section,
                    $students,
                    $academicYearId,
                    $periodId,
                    $courseId,
                    $evaluations,
                    'grade'
                )
            );
        }

        $finalResults = DB::table('final_competency_results as fcr')
            ->join('competencies as comp', 'comp.id', '=', 'fcr.competency_id')
            ->join('courses as c', 'c.id', '=', 'fcr.course_id')
            ->select([
                'fcr.student_id',
                'fcr.course_id',
                'fcr.competency_id',
                'fcr.final_level',
                DB::raw("COALESCE(comp.{$competencyLabelColumn}, 'Competencia') as competency_name"),
                DB::raw("COALESCE(c.name, '') as course_name"),
            ])
            ->whereIn('fcr.student_id', $studentIds)
            ->where('fcr.academic_year_id', $academicYearId)
            ->when($courseId, fn ($query) => $query->where('fcr.course_id', $courseId))
            ->orderBy('c.name')
            ->orderBy("comp.{$competencyLabelColumn}")
            ->get();

        return response()->json(
            $this->buildSectionEvaluationPayload(
                $section,
                $students,
                $academicYearId,
                null,
                $courseId,
                $finalResults,
                'final_level'
            )
        );
    }

    /**
     * RESUMEN ASISTENCIA
     * GET /api/reports/students/{student}/attendance?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
     */
    public function attendanceSummary(Student $student, Request $request)
    {
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $q = DB::table('attendance')
            ->where('attendance.student_id', $student->id);

        if ($dateFrom) $q->whereDate('attendance.date', '>=', $dateFrom);
        if ($dateTo) $q->whereDate('attendance.date', '<=', $dateTo);

        // Conteo por estado (presente/tarde/falta/justificado)
        $counts = (clone $q)
            ->select('attendance.status', DB::raw('COUNT(*)::int as total'))
            ->groupBy('attendance.status')
            ->orderBy('attendance.status')
            ->get();

        // últimos registros
        $records = (clone $q)
            ->leftJoin('courses', 'courses.id', '=', 'attendance.course_id')
            ->leftJoin('attendance_justifications as aj', 'aj.attendance_id', '=', 'attendance.id')
            ->select([
                'attendance.id',
                'attendance.date',
                'attendance.status',
                'attendance.justification',
                'attendance.course_id',
                DB::raw("COALESCE(courses.name, '') as course_name"),
                DB::raw("COALESCE(courses.code, '') as course_code"),
                DB::raw("case when aj.id is null then null else json_build_object(
                    'id', aj.id,
                    'status', aj.status,
                    'reason', aj.reason,
                    'review_notes', aj.review_notes,
                    'reviewed_at', aj.reviewed_at
                ) end as justification_data"),
            ])
            ->orderByDesc('attendance.date')
            ->orderByDesc('attendance.updated_at')
            ->get();

        return response()->json([
            'student_id' => $student->id,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'counts_by_status' => $counts,
            'records' => $records,
            'recent' => $records->take(30)->values(),
        ]);
    }

    /**
     * RESUMEN FINANCIERO (CARGOS/PAGOS)
     * GET /api/reports/students/{student}/financial?academic_year_id=UUID
     */
    public function financialSummary(Student $student, Request $request)
    {
        $yearId = $request->query('academic_year_id');
        $driver = DB::getDriverName();
        $paymentMethodColumn = Schema::hasColumn('payments', 'method') ? 'method' : 'payment_method';
        $paymentReferenceColumn = Schema::hasColumn('payments', 'reference') ? 'reference' : 'transaction_ref';
        $paymentPaidAtColumn = Schema::hasColumn('payments', 'paid_at') ? 'paid_at' : 'payment_date';
        $receiptNumberColumn = Schema::hasColumn('receipts', 'number') ? 'number' : 'receipt_number';
        $receiptTotalColumn = Schema::hasColumn('receipts', 'total') ? 'total' : 'total_amount';
        $receiptIssuedAtColumn = Schema::hasColumn('receipts', 'issued_at') ? 'issued_at' : 'created_at';
        $chargeVoidedCondition = Schema::hasColumn('charges', 'voided_at')
            ? 'ch.voided_at IS NOT NULL'
            : 'false';
        $chargeStatusExpression = $driver === 'pgsql'
            ? "CASE WHEN {$chargeVoidedCondition} THEN 'anulado' ELSE COALESCE(ch.status::text, 'pendiente') END"
            : "CASE WHEN {$chargeVoidedCondition} THEN 'anulado' ELSE COALESCE(ch.status, 'pendiente') END";
        $chargeVoidedAtExpression = Schema::hasColumn('charges', 'voided_at')
            ? 'ch.voided_at'
            : 'NULL';
        $chargeVoidReasonExpression = Schema::hasColumn('charges', 'void_reason')
            ? "COALESCE(ch.void_reason, '')"
            : "''";
        $paymentVoidedAtExpression = Schema::hasColumn('payments', 'voided_at')
            ? 'p.voided_at'
            : 'NULL';
        $paymentVoidReasonExpression = Schema::hasColumn('payments', 'void_reason')
            ? "COALESCE(p.void_reason, '')"
            : "''";

        $q = DB::table('charges as ch')
            ->leftJoin('fee_concepts as fc', 'fc.id', '=', 'ch.concept_id')
            ->select([
                'ch.id',
                'ch.student_id',
                'ch.academic_year_id',
                'ch.concept_id',
                DB::raw("COALESCE(fc.name,'') as concept_name"),
                'ch.type',
                DB::raw("{$chargeStatusExpression} as status"),
                'ch.amount',
                DB::raw("COALESCE(ch.discount_amount,0) as discount_amount"),
                DB::raw("COALESCE(ch.paid_amount,0) as paid_amount"),
                'ch.due_date',
                DB::raw("COALESCE(ch.notes,'') as notes"),
                DB::raw("{$chargeVoidedAtExpression} as voided_at"),
                DB::raw("{$chargeVoidReasonExpression} as void_reason"),
                'ch.created_at',
            ])
            ->where('ch.student_id', $student->id);

        if ($yearId) {
            $q->where('ch.academic_year_id', $yearId);
        }

        $charges = $q->orderByDesc('ch.due_date')->orderByDesc('ch.created_at')->get();
        $payments = DB::table('payments as p')
            ->leftJoin('charges as ch', 'ch.id', '=', 'p.charge_id')
            ->leftJoin('fee_concepts as fc', 'fc.id', '=', 'ch.concept_id')
            ->leftJoin('receipts as r', 'r.payment_id', '=', 'p.id')
            ->select([
                'p.id',
                'p.student_id',
                'p.charge_id',
                'ch.academic_year_id',
                DB::raw("COALESCE(fc.name, '') as concept_name"),
                'p.amount',
                DB::raw("COALESCE(p.{$paymentMethodColumn}, '') as method"),
                DB::raw("NULLIF(COALESCE(p.{$paymentReferenceColumn}, ''), '') as reference"),
                DB::raw("p.{$paymentPaidAtColumn} as paid_at"),
                DB::raw("COALESCE(p.notes, '') as notes"),
                DB::raw("{$paymentVoidedAtExpression} as voided_at"),
                DB::raw("{$paymentVoidReasonExpression} as void_reason"),
                DB::raw("NULLIF(COALESCE(r.{$receiptNumberColumn}, ''), '') as receipt_number"),
                DB::raw("COALESCE(r.{$receiptTotalColumn}, 0) as receipt_total"),
                DB::raw("r.{$receiptIssuedAtColumn} as receipt_issued_at"),
                'p.created_at',
            ])
            ->where('p.student_id', $student->id)
            ->when($yearId, function ($query) use ($yearId) {
                $query->where('ch.academic_year_id', $yearId);
            })
            ->orderByDesc("p.{$paymentPaidAtColumn}")
            ->orderByDesc('p.created_at')
            ->get();

        // Totales
        $total = 0.0;
        $discount = 0.0;
        $paid = 0.0;

        foreach ($charges as $c) {
            if (($c->status ?? null) === 'anulado') {
                continue;
            }

            $total += (float) $c->amount;
            $discount += (float) $c->discount_amount;
            $paid += (float) $c->paid_amount;
        }

        $net = max(0, $total - $discount);
        $pending = max(0, $net - $paid);

        return response()->json([
            'student_id' => $student->id,
            'filters' => [
                'academic_year_id' => $yearId,
            ],
            'totals' => [
                'total_amount' => $total,
                'total_discount' => $discount,
                'net_total' => $net,
                'paid_total' => $paid,
                'pending_total' => $pending,
            ],
            'charges' => $charges,
            'payments' => $payments,
        ]);
    }

    /**
     * DASHBOARD ADMIN (resumen general)
     * GET /api/dashboard
     */
    public function dashboard(Request $request)
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        // Estudiantes
        $studentsCount = DB::table('students')->count();

        // Asistencia hoy
        $attendanceToday = DB::table('attendance')
            ->whereDate('date', $today)
            ->select('status', DB::raw('COUNT(*)::int as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        // Cargos vencidos o pendientes
        $chargesPending = DB::table('charges')
            ->whereIn('status', ['pendiente','vencido','pagado_parcial'])
            ->count();

        // Pagos del mes (suma)
        $paymentsMonthSum = 0;
        if (Schema::hasColumn('payments', 'paid_at')) {
            $paymentsMonthSum = (float) (DB::table('payments')
                ->whereDate('paid_at', '>=', $monthStart)
                ->sum('amount'));
        } else {
            // fallback por created_at
            $paymentsMonthSum = (float) (DB::table('payments')
                ->whereDate('created_at', '>=', $monthStart)
                ->sum('amount'));
        }

        // Comunicados publicados recientes
        $announcementsPublished = DB::table('announcements')
            ->where('status', 'publicado')
            ->count();

        // Tareas próximas a vencer (si existe due_date en assignments)
        $assignmentsDueSoon = 0;
        if (Schema::hasColumn('assignments', 'due_date')) {
            $assignmentsDueSoon = DB::table('assignments')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '>=', $today)
                ->whereDate('due_date', '<=', now()->addDays(7)->toDateString())
                ->count();
        }

        // Evaluaciones publicadas (si existe status)
        $evaluationsPublished = 0;
        if (Schema::hasColumn('evaluations', 'status')) {
            $evaluationsPublished = DB::table('evaluations')
                ->where('status', 'publicada')
                ->count();
        }

        return response()->json([
            'date' => $today,
            'students_count' => $studentsCount,
            'attendance_today' => $attendanceToday,
            'charges_pending_count' => $chargesPending,
            'payments_month_sum' => $paymentsMonthSum,
            'announcements_published_count' => $announcementsPublished,
            'assignments_due_7days_count' => $assignmentsDueSoon,
            'evaluations_published_count' => $evaluationsPublished,
        ]);
    }

    private function loadSectionStudents(Section $section, ?string $academicYearId): array
    {
        return StudentCourseEnrollment::query()
            ->with('student')
            ->where('section_id', $section->id)
            ->when($academicYearId, fn ($query) => $query->where('academic_year_id', $academicYearId))
            ->where('status', 'active')
            ->get()
            ->filter(fn (StudentCourseEnrollment $enrollment) => $enrollment->student)
            ->sortBy(fn (StudentCourseEnrollment $enrollment) => sprintf(
                '%s %s',
                $enrollment->student->last_name ?? '',
                $enrollment->student->first_name ?? ''
            ))
            ->unique('student_id')
            ->map(function (StudentCourseEnrollment $enrollment) {
                return [
                    'id' => (string) $enrollment->student->id,
                    'student_code' => (string) ($enrollment->student->student_code ?: 'SIN-COD'),
                    'full_name' => (string) ($enrollment->student->full_name ?: 'Estudiante'),
                ];
            })
            ->values()
            ->all();
    }

    private function buildSectionEvaluationPayload(
        Section $section,
        array $students,
        ?string $academicYearId,
        ?string $periodId,
        ?string $courseId,
        iterable $records,
        string $gradeKey
    ): array {
        $recordsByStudent = [];
        $competencyMap = [];
        $allLevels = [];

        foreach ($records as $record) {
            $studentId = (string) $record->student_id;
            $competencyId = (string) $record->competency_id;
            $level = (string) ($record->{$gradeKey} ?? '');

            $recordsByStudent[$studentId][] = [
                'competency_id' => $competencyId,
                'competency_name' => (string) $record->competency_name,
                'course_name' => (string) $record->course_name,
                'level' => $level,
            ];

            $competencyMap[$competencyId] = [
                'id' => $competencyId,
                'description' => (string) $record->competency_name,
                'course_name' => (string) $record->course_name,
            ];

            if (in_array($level, ['AD', 'A', 'B', 'C'], true)) {
                $allLevels[] = $level;
            }
        }

        $rows = [];
        $studentsAtRisk = 0;

        foreach ($students as $student) {
            $studentRecords = $recordsByStudent[$student['id']] ?? [];
            $competencies = [];
            $levels = [];

            foreach ($studentRecords as $record) {
                $competencies[$record['competency_id']] = $record['level'] ?: '-';
                if (in_array($record['level'], ['AD', 'A', 'B', 'C'], true)) {
                    $levels[] = $record['level'];
                }
            }

            $riskCount = count(array_filter($levels, fn (string $level) => in_array($level, ['B', 'C'], true)));
            if ($riskCount >= 2) {
                $studentsAtRisk++;
            }

            $rows[] = [
                'student_id' => $student['id'],
                'student_code' => $student['student_code'],
                'student_name' => $student['full_name'],
                'competencies' => $competencies,
                'final_grade' => $this->aggregateLevels($levels),
            ];
        }

        $competencies = array_values($competencyMap);
        usort($competencies, fn (array $a, array $b) => strcmp($a['description'], $b['description']));

        return [
            'section' => [
                'id' => $section->id,
                'label' => $this->buildSectionLabel($section),
            ],
            'filters' => [
                'academic_year_id' => $academicYearId,
                'period_id' => $periodId,
                'course_id' => $courseId,
            ],
            'stats' => [
                'students_count' => count($rows),
                'students_at_risk' => $studentsAtRisk,
                'grade_distribution' => $this->calculateDistribution($allLevels),
            ],
            'competencies' => $competencies,
            'rows' => $rows,
        ];
    }

    private function calculateDistribution(array $levels): array
    {
        if ($levels === []) {
            return ['AD' => 0, 'A' => 0, 'B' => 0, 'C' => 0];
        }

        $counts = ['AD' => 0, 'A' => 0, 'B' => 0, 'C' => 0];
        foreach ($levels as $level) {
            if (array_key_exists($level, $counts)) {
                $counts[$level]++;
            }
        }

        return [
            'AD' => (int) round(($counts['AD'] / count($levels)) * 100),
            'A' => (int) round(($counts['A'] / count($levels)) * 100),
            'B' => (int) round(($counts['B'] / count($levels)) * 100),
            'C' => (int) round(($counts['C'] / count($levels)) * 100),
        ];
    }

    private function aggregateLevels(array $levels): string
    {
        $filteredLevels = array_values(array_filter(
            $levels,
            fn ($level) => in_array($level, ['AD', 'A', 'B', 'C'], true)
        ));

        if ($filteredLevels === []) {
            return '-';
        }

        $order = ['C' => 1, 'B' => 2, 'A' => 3, 'AD' => 4];
        $lowest = $filteredLevels[0];

        foreach ($filteredLevels as $level) {
            if (($order[$level] ?? 0) < ($order[$lowest] ?? 0)) {
                $lowest = $level;
            }
        }

        return $lowest;
    }

    private function buildSectionLabel(Section $section): string
    {
        return trim(($section->gradeLevel?->name ?? '') . ' ' . ($section->section_letter ?? ''));
    }

    private function resolvePeriod(?string $periodId): ?object
    {
        if (!$periodId) {
            return null;
        }

        $period = DB::table('periods')
            ->select(['id', 'name', 'academic_year_id', 'start_date', 'end_date'])
            ->where('id', $periodId)
            ->first();

        if (!$period) {
            throw ValidationException::withMessages([
                'period_id' => 'El periodo seleccionado no existe.',
            ]);
        }

        return $period;
    }

    private function validateSectionAcademicYear(Section $section, ?string $academicYearId): void
    {
        if ($academicYearId && (string) $section->academic_year_id !== (string) $academicYearId) {
            throw ValidationException::withMessages([
                'academic_year_id' => 'La seccion seleccionada no pertenece al anio academico indicado.',
            ]);
        }
    }

    private function validatePeriodAgainstAcademicYear(?object $period, ?string $academicYearId): void
    {
        if ($period && $academicYearId && (string) $period->academic_year_id !== (string) $academicYearId) {
            throw ValidationException::withMessages([
                'period_id' => 'El periodo seleccionado no pertenece al anio academico indicado.',
            ]);
        }
    }

    private function validateCourseAgainstSection(Section $section, ?string $courseId): void
    {
        if (!$courseId) {
            return;
        }

        $exists = DB::table('courses')
            ->where('id', $courseId)
            ->where('grade_level_id', $section->grade_level_id)
            ->exists();

        if (!$exists) {
            throw ValidationException::withMessages([
                'course_id' => 'El curso seleccionado no corresponde al grado de la seccion.',
            ]);
        }
    }
}
