<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChargeRequest;
use App\Http\Requests\UpdateChargeRequest;
use App\Models\Charge;
use App\Models\FinancialPlan;
use App\Models\Student;
use App\Models\StudentDiscount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $q = Charge::with(['student.section.gradeLevel', 'concept', 'payments']);
        $perPage = max(1, min((int) $request->integer('per_page', 50), 1000));

        if (!$request->boolean('include_voided')) {
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
        $actorId = $this->resolveAuthSchemaUserId($request);

        if (Schema::hasColumn('charges', 'created_by')) {
            $data['created_by'] = $actorId;
        }

        $charge = Charge::create($this->buildChargeInsert($data));

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
            $this->fillChargeNoteFields($update, $data['notes']);
        }

        $charge->update($update);

        return $charge->load(['student.section.gradeLevel', 'concept', 'payments']);
    }

    public function batchStore(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'financial_plan_id' => 'required|uuid|exists:financial_plans,id',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
        ]);

        $academicYearId = $request->academic_year_id;
        $plan = FinancialPlan::with(['installments', 'concept'])->findOrFail($request->financial_plan_id);

        if ($plan->installments->isEmpty()) {
            return response()->json([
                'message' => 'El plan seleccionado no tiene cuotas configuradas.',
            ], 422);
        }

        $students = Student::query()
            ->where(function ($studentQuery) use ($academicYearId, $request) {
                $studentQuery->whereHas('section', function ($sectionQuery) use ($academicYearId, $request) {
                    $sectionQuery->where('academic_year_id', $academicYearId);

                    if ($request->filled('grade_level_id')) {
                        $sectionQuery->where('grade_level_id', $request->grade_level_id);
                    }

                    if ($request->filled('section_id')) {
                        $sectionQuery->where('id', $request->section_id);
                    }
                })->orWhereHas('enrollments', function ($enrollmentQuery) use ($academicYearId, $request) {
                    $enrollmentQuery->where('academic_year_id', $academicYearId);

                    if ($request->filled('section_id')) {
                        $enrollmentQuery->where('section_id', $request->section_id);
                    }

                    if ($request->filled('grade_level_id')) {
                        $enrollmentQuery->whereHas('section', function ($sectionQuery) use ($request) {
                            $sectionQuery->where('grade_level_id', $request->grade_level_id);
                        });
                    }
                });
            })
            ->get();

        $studentIds = $students->pluck('id')->all();

        if (empty($studentIds)) {
            $scope = [];

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

        $studentDiscounts = StudentDiscount::with('discount')
            ->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $academicYearId)
            ->get()
            ->groupBy('student_id');

        $chargeType = in_array($plan->concept?->type, ['matricula', 'pension'], true)
            ? $plan->concept->type
            : 'otro';

        $createdCount = 0;
        $notesColumn = $this->chargeNotesColumn();
        $actorId = $this->resolveAuthSchemaUserId($request);

        DB::transaction(function () use (
            $students,
            $plan,
            $academicYearId,
            $studentDiscounts,
            $chargeType,
            $notesColumn,
            $actorId,
            &$createdCount
        ) {
            foreach ($students as $student) {
                foreach ($plan->installments as $installment) {
                    $note = "Generado automaticamente - {$plan->name} - Cuota #{$installment->installment_number}";

                    $exists = Charge::where('student_id', $student->id)
                        ->where('academic_year_id', $academicYearId)
                        ->where('concept_id', $plan->concept_id)
                        ->whereDate('due_date', $installment->due_date)
                        ->where($notesColumn, $note)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    $amount = (float) $installment->amount;
                    $discountAmount = 0.0;

                    if ($studentDiscounts->has($student->id)) {
                        foreach ($studentDiscounts->get($student->id) as $studentDiscount) {
                            $discount = $studentDiscount->discount;

                            if (!$discount || !$discount->is_active) {
                                continue;
                            }

                            $applies = ($discount->scope === 'todos')
                                || ($discount->scope === $plan->concept?->type)
                                || ($discount->scope === 'especifico' && $discount->specific_concept_id === $plan->concept_id);

                            if (!$applies) {
                                continue;
                            }

                            if ($discount->type === 'porcentaje') {
                                $discountAmount += ($amount * ((float) $discount->value / 100));
                            } else {
                                $discountAmount += (float) $discount->value;
                            }
                        }
                    }

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

                    if (Schema::hasColumn('charges', 'created_by')) {
                        $payload['created_by'] = $actorId;
                    }

                    Charge::create($this->buildChargeInsert($payload));
                    $createdCount++;
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
            'voided_by' => $this->resolveAuthSchemaUserId($request),
            'void_reason' => $data['reason'],
        ]);

        return response()->json([
            'message' => 'Cargo anulado correctamente.',
            'data' => $charge->fresh()->load(['student.section.gradeLevel', 'concept', 'payments']),
        ]);
    }

    private function buildChargeInsert(array $data): array
    {
        $amount = (float) ($data['amount'] ?? 0);
        $discountAmount = min((float) ($data['discount_amount'] ?? 0), $amount);
        $payload = [
            'student_id' => $data['student_id'],
            'academic_year_id' => $data['academic_year_id'],
            'concept_id' => $data['concept_id'] ?? null,
            'type' => $data['type'],
            'status' => $data['status'] ?? 'pendiente',
            'amount' => $amount,
            'due_date' => $data['due_date'] ?? null,
            'created_by' => $data['created_by'] ?? null,
        ];

        $this->fillChargeNoteFields($payload, $data['notes'] ?? null);

        if (Schema::hasColumn('charges', 'discount_amount')) {
            $payload['discount_amount'] = $discountAmount;
        } else {
            $payload['discount'] = $discountAmount;
        }

        if (Schema::hasColumn('charges', 'paid_amount')) {
            $payload['paid_amount'] = (float) ($data['paid_amount'] ?? 0);
        }

        if (Schema::hasColumn('charges', 'final_amount')) {
            $payload['final_amount'] = max(0, $amount - $discountAmount);
        }

        return $payload;
    }

    private function chargeNotesColumn(): string
    {
        return Schema::hasColumn('charges', 'notes') ? 'notes' : 'description';
    }

    private function fillChargeNoteFields(array &$payload, ?string $notes): void
    {
        $noteValue = filled($notes) ? trim($notes) : 'Cargo financiero';

        if (Schema::hasColumn('charges', 'notes')) {
            $payload['notes'] = $noteValue;
        }

        if (Schema::hasColumn('charges', 'description')) {
            $payload['description'] = $noteValue;
        }
    }

    private function resolveAuthSchemaUserId(Request $request): ?string
    {
        $authUser = $request->user();

        if (!$authUser) {
            return null;
        }

        $emailCandidates = array_values(array_filter([
            $authUser->email ?? null,
            $authUser->profile?->email ?? null,
        ]));

        foreach ($emailCandidates as $email) {
            $authSchemaUserId = DB::table('auth.users')
                ->whereRaw('lower(email) = ?', [strtolower((string) $email)])
                ->value('id');

            if ($authSchemaUserId) {
                return (string) $authSchemaUserId;
            }
        }

        $candidateIds = array_values(array_filter([
            $authUser->id ?? null,
            $authUser->user_id ?? null,
            $authUser->profile?->user_id ?? null,
        ]));

        foreach ($candidateIds as $candidateId) {
            $candidateId = (string) $candidateId;

            if ($candidateId !== '' && DB::table('auth.users')->where('id', $candidateId)->exists()) {
                return $candidateId;
            }
        }

        return null;
    }
}
