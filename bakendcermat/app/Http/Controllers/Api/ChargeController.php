<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChargeRequest;
use App\Http\Requests\UpdateChargeRequest;
use App\Models\Charge;
use App\Models\FinancialPlan;
use App\Models\Student;
use App\Services\ChargeIssuanceService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChargeController extends Controller
{
    public function __construct(
        private readonly ChargeIssuanceService $chargeIssuance
    ) {}

    public function index(Request $request)
    {
        $q = Charge::with(['student.section.gradeLevel', 'concept', 'payments']);
        $perPage = max(1, min((int) $request->integer('per_page', 50), 1000));

        if (! $request->boolean('include_voided')) {
            $q->whereNull('voided_at');
        }

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'anulado') {
                $q->whereNotNull('voided_at');
            } else {
                $q->where('status', $request->status);
            }
        }

        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }

        if ($request->filled('concept_id')) {
            $q->where('concept_id', $request->concept_id);
        }

        return $q->orderByDesc('due_date')->orderByDesc('created_at')->paginate($perPage);
    }

    public function store(StoreChargeRequest $request)
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? 'pendiente';
        $data['discount_amount'] = $data['discount_amount'] ?? 0;
        $data['paid_amount'] = $data['paid_amount'] ?? 0;
        $actorId = $this->chargeIssuance->resolveActorUserId($request->user());

        if ($this->chargeIssuance->supportsCreatedBy()) {
            $data['created_by'] = $actorId;
        }

        try {
            $charge = $this->chargeIssuance->create($data);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json([
                    'message' => 'Ya existe un cargo activo identico para este estudiante, concepto, fecha de vencimiento y nota.',
                ], 422);
            }

            throw $e;
        }

        return response()->json(
            $charge->load(['student.section.gradeLevel', 'concept', 'payments']),
            201
        );
    }

    public function show(Charge $charge)
    {
        return $charge->load(['student.section.gradeLevel', 'concept', 'payments']);
    }

    public function update(UpdateChargeRequest $request, Charge $charge)
    {
        $data = $request->validated();
        $update = [];

        if (array_key_exists('status', $data)) {
            $update['status'] = $data['status'];
        }

        if (array_key_exists('due_date', $data)) {
            $update['due_date'] = $data['due_date'];
        }

        if (array_key_exists('notes', $data)) {
            $this->chargeIssuance->fillChargeNoteFields($update, $data['notes']);
        }

        try {
            $charge->update($update);
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return response()->json([
                    'message' => 'Ya existe un cargo activo identico para este estudiante, concepto, fecha de vencimiento y nota.',
                ], 422);
            }

            throw $e;
        }

        return $charge->load(['student.section.gradeLevel', 'concept', 'payments']);
    }

    public function batchPreview(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'level' => 'nullable|string|in:inicial,primaria,secundaria',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
        ]);

        $academicYearId = $request->academic_year_id;

        $studentsCount = $this->resolveEmissionStudentsQuery($request, $academicYearId)->count();

        $sectionsQuery = \App\Models\Section::query()->where('academic_year_id', $academicYearId);

        if ($request->filled('grade_level_id')) {
            $sectionsQuery->where('grade_level_id', $request->grade_level_id);
        }

        if ($request->filled('section_id')) {
            $sectionsQuery->where('id', $request->section_id);
        }

        if ($request->filled('level')) {
            $level = $request->string('level')->lower()->value();
            $sectionsQuery->whereHas('gradeLevel', function ($gradeLevelQuery) use ($level) {
                $gradeLevelQuery->where('level', $level);
            });
        }

        return response()->json([
            'students_count' => $studentsCount,
            'sections_count' => $sectionsQuery->count(),
        ]);
    }

    private function resolveEmissionStudentsQuery(Request $request, string $academicYearId)
    {
        return Student::query()
            ->where(function ($studentQuery) use ($academicYearId, $request) {
                $studentQuery->whereHas('section', function ($sectionQuery) use ($academicYearId, $request) {
                    $sectionQuery->where('academic_year_id', $academicYearId);

                    if ($request->filled('grade_level_id')) {
                        $sectionQuery->where('grade_level_id', $request->grade_level_id);
                    }

                    if ($request->filled('section_id')) {
                        $sectionQuery->where('id', $request->section_id);
                    }

                    if ($request->filled('level')) {
                        $level = $request->string('level')->lower()->value();
                        $sectionQuery->whereHas('gradeLevel', function ($gradeLevelQuery) use ($level) {
                            $gradeLevelQuery->where('level', $level);
                        });
                    }
                })->orWhereHas('enrollments', function ($enrollmentQuery) use ($academicYearId, $request) {
                    $enrollmentQuery->where('academic_year_id', $academicYearId);

                    if ($request->filled('section_id')) {
                        $enrollmentQuery->where('section_id', $request->section_id);
                    }

                    if ($request->filled('grade_level_id') || $request->filled('level')) {
                        $enrollmentQuery->whereHas('section', function ($sectionQuery) use ($request) {
                            if ($request->filled('grade_level_id')) {
                                $sectionQuery->where('grade_level_id', $request->grade_level_id);
                            }

                            if ($request->filled('level')) {
                                $level = $request->string('level')->lower()->value();
                                $sectionQuery->whereHas('gradeLevel', function ($gradeLevelQuery) use ($level) {
                                    $gradeLevelQuery->where('level', $level);
                                });
                            }
                        });
                    }
                });
            })
            ->distinct();
    }

    public function batchStore(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'financial_plan_id' => 'required|uuid|exists:financial_plans,id',
            'level' => 'nullable|string|in:inicial,primaria,secundaria',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'student_id' => 'nullable|uuid|exists:students,id',
        ]);

        $academicYearId = $request->academic_year_id;
        $plan = FinancialPlan::with(['installments', 'concept'])->findOrFail($request->financial_plan_id);

        if ($plan->installments->isEmpty()) {
            return response()->json([
                'message' => 'El plan seleccionado no tiene cuotas configuradas.',
            ], 422);
        }

        $studentsQuery = $this->resolveEmissionStudentsQuery($request, $academicYearId);

        if ($request->filled('student_id')) {
            $studentsQuery->where('id', $request->student_id);
        }

        $students = $studentsQuery->get();

        $studentIds = $students->pluck('id')->all();

        if (empty($studentIds)) {
            $scope = [];

            if ($request->filled('level')) {
                $scope[] = 'nivel';
            }

            if ($request->filled('grade_level_id')) {
                $scope[] = 'grado';
            }

            if ($request->filled('section_id')) {
                $scope[] = 'seccion';
            }

            $scopeLabel = empty($scope) ? 'anio academico' : implode(' y ', $scope);

            return response()->json([
                'message' => "No se encontraron estudiantes para los filtros seleccionados. Verifica que los alumnos esten asignados a la seccion o matriculados en el {$scopeLabel} elegido.",
                'created_count' => 0,
            ]);
        }

        $chargeType = in_array($plan->concept?->type, ['matricula', 'pension'], true)
            ? $plan->concept->type
            : 'otro';

        $createdCount = 0;
        $actorId = $this->chargeIssuance->resolveActorUserId($request->user());
        $issuance = $this->chargeIssuance;

        DB::transaction(function () use (
            $students,
            $plan,
            $academicYearId,
            $chargeType,
            $actorId,
            $issuance,
            &$createdCount
        ) {
            foreach ($students as $student) {
                foreach ($plan->installments as $installment) {
                    $note = "Generado automaticamente - {$plan->name} - Cuota #{$installment->installment_number}";

                    // El criterio de duplicidad y la construccion del cargo
                    // viven en ChargeIssuanceService, compartidos con el flujo
                    // de aprobacion de matricula (ver issueIfAbsent).
                    $amount = (float) $installment->amount;

                    // Descuento siempre en 0 al generar cargos masivos.
                    // El descuento se asigna manualmente desde
                    // Finanzas -> Descuentos -> Asignar descuento al estudiante
                    // especifico (ver StudentDiscountController::store), que
                    // actualiza los cargos pendientes con el monto correspondiente.
                    $discountAmount = 0.0;

                    $payload = [
                        'student_id' => $student->id,
                        'academic_year_id' => $academicYearId,
                        'concept_id' => $plan->concept_id,
                        'type' => $chargeType,
                        'status' => 'pendiente',
                        'amount' => $amount,
                        'discount_amount' => min($discountAmount, $amount),
                        'due_date' => $installment->due_date,
                        'notes' => $note,
                    ];

                    if ($issuance->supportsCreatedBy()) {
                        $payload['created_by'] = $actorId;
                    }

                    if ($issuance->issueIfAbsent($payload)) {
                        $createdCount++;
                    }
                }
            }
        });

        return response()->json([
            'message' => "Se han generado {$createdCount} cargos exitosamente.",
            'created_count' => $createdCount,
        ]);
    }

    public function destroy(Charge $charge)
    {
        $activePaymentsCount = $charge->payments()
            ->whereNull('voided_at')
            ->count();

        if ($activePaymentsCount > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un cargo con pagos activos. Debes anular los pagos primero.',
            ], 422);
        }

        $charge->delete();

        return response()->noContent();
    }

    public function void(Request $request, Charge $charge)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $charge = Charge::with('payments')->findOrFail($charge->id);

        if ($charge->voided_at) {
            return response()->json([
                'message' => 'El cargo ya fue anulado previamente.',
            ], 422);
        }

        $activePaymentsAmount = (float) $charge->payments
            ->filter(fn ($payment) => empty($payment->voided_at))
            ->sum('amount');

        if ($activePaymentsAmount > 0) {
            return response()->json([
                'message' => 'No se puede anular un cargo que todavia tiene pagos vigentes. Anula primero sus pagos.',
            ], 422);
        }

        $charge->update([
            'paid_amount' => 0,
            'voided_at' => now(),
            'voided_by' => $this->chargeIssuance->resolveActorUserId($request->user()),
            'void_reason' => $data['reason'],
        ]);

        return response()->json([
            'message' => 'Cargo anulado correctamente.',
            'data' => $charge->fresh()->load(['student.section.gradeLevel', 'concept', 'payments']),
        ]);
    }
}
