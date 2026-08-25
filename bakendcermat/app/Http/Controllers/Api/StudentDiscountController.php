<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentDiscountRequest;
use App\Http\Requests\UpdateStudentDiscountRequest;
use App\Models\Charge;
use App\Models\Student;
use App\Models\StudentDiscount;
use Illuminate\Http\Request;

class StudentDiscountController extends Controller
{
    public function index(Request $request)
    {
        $q = StudentDiscount::with(['student', 'discount', 'academicYear', 'assignedBy']);

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('discount_id')) {
            $q->where('discount_id', $request->discount_id);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        return $q->orderByDesc('created_at')->paginate(50);
    }

    public function store(StoreStudentDiscountRequest $request)
    {
        $data = $request->validated();

        $exists = StudentDiscount::where('student_id', $data['student_id'])
            ->where('discount_id', $data['discount_id'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ese descuento ya fue asignado al estudiante en ese año académico.'
            ], 422);
        }

        $data['assigned_by'] = optional($request->user())->id;
        $data['created_at'] = now();

        $studentDiscount = StudentDiscount::create($data);

        // Al asignar el descuento manualmente, recalcular los cargos pendientes
        // existentes del estudiante sumando TODOS sus descuentos activos que
        // apliquen (no solo el recien asignado). El flujo de generacion masiva
        // (batchStore) ya no aplica descuentos, por lo que esta es la unica via
        // de asignacion.
        $this->recalculateDiscountsForStudent($studentDiscount->student_id, $studentDiscount->academic_year_id);

        return response()->json(
            $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']),
            201
        );
    }

    /**
     * Recalcula discount_amount / final_amount de los cargos pendientes de un
     * estudiante sumando TODOS sus descuentos activos que apliquen segun el
     * scope de cada cargo:
     *  - todos       => aplica a cualquier cargo
     *  - pension     => solo cargos type = pension
     *  - matricula   => solo cargos type = matricula
     *  - especifico  => solo el cargo del concepto especifico del descuento
     *
     * Los descuentos de tipo porcentaje se suman entre si (ej. 10% + 20% = 30%)
     * y se calculan sobre el monto bruto del cargo; los de monto_fijo se suman
     * en soles. El descuento total nunca supera el monto del cargo.
     */
    private function recalculateDiscountsForStudent(string $studentId, string $academicYearId): void
    {
        $activeDiscounts = StudentDiscount::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->whereHas('discount', fn ($q) => $q->where('is_active', true))
            ->with('discount')
            ->get();

        $charges = Charge::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'pendiente')
            ->whereNull('voided_at')
            ->get();

        foreach ($charges as $charge) {
            $applicable = $activeDiscounts->filter(function (StudentDiscount $sd) use ($charge) {
                $discount = $sd->discount;

                if (!$discount) {
                    return false;
                }

                return match ($discount->scope) {
                    'todos' => true,
                    'pension', 'matricula' => $discount->scope === $charge->type,
                    'especifico' => $discount->specific_concept_id === $charge->concept_id,
                    default => false,
                };
            });

            $percentSum = (float) $applicable
                ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'porcentaje')
                ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

            $fixedSum = (float) $applicable
                ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'monto_fijo')
                ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

            $amount = (float) $charge->amount;
            $discountFromPercent = round($amount * $percentSum / 100, 2);
            $totalDiscount = min($amount, $discountFromPercent + $fixedSum);

            $charge->update([
                'discount_amount' => $totalDiscount,
                'final_amount' => max(0, $amount - $totalDiscount),
            ]);
        }
    }

    public function show(StudentDiscount $studentDiscount)
    {
        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function update(UpdateStudentDiscountRequest $request, StudentDiscount $studentDiscount)
    {
        $studentDiscount->update($request->validated());
        $this->recalculateDiscountsForStudent($studentDiscount->student_id, $studentDiscount->academic_year_id);

        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function destroy(StudentDiscount $studentDiscount)
    {
        $studentId = $studentDiscount->student_id;
        $academicYearId = $studentDiscount->academic_year_id;

        $studentDiscount->delete();

        // Recalcular sin el descuento eliminado: si quedan otros descuentos
        // activos se reaplican solo ellos; si no queda ninguno, los cargos
        // vuelven a discount_amount = 0.
        $this->recalculateDiscountsForStudent($studentId, $academicYearId);

        return response()->noContent();
    }

    /**
     * Resumen de descuentos activos de un estudiante para un anio academico:
     * lista de descuentos, suma total de porcentaje, y una muestra del
     * impacto sobre un cargo real (el primero pendiente que encuentre).
     */
    public function summary(Request $request, Student $student)
    {
        $academicYearId = $request->input('academic_year_id');

        $query = StudentDiscount::where('student_id', $student->id)
            ->whereHas('discount', fn ($q) => $q->where('is_active', true))
            ->with('discount');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        $studentDiscounts = $query->get();

        $discounts = $studentDiscounts->map(fn (StudentDiscount $sd) => [
            'id' => $sd->id,
            'name' => $sd->discount->name,
            'type' => $sd->discount->type,
            'value' => (float) $sd->discount->value,
            'scope' => $sd->discount->scope,
        ])->values();

        $totalPercent = (float) $studentDiscounts
            ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'porcentaje')
            ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

        $totalFixed = (float) $studentDiscounts
            ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'monto_fijo')
            ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

        $chargeQuery = Charge::where('student_id', $student->id)
            ->whereNull('voided_at')
            ->with('concept');

        if ($academicYearId) {
            $chargeQuery->where('academic_year_id', $academicYearId);
        }

        // Todos los cargos no anulados del anio (pendientes y pagados): cada
        // uno ya trae su propio discount_amount/final_amount reales, correctos
        // segun el scope que le aplico (pension, matricula, etc). El resumen
        // anual solo los suma, no reinterpreta ni asume un porcentaje unico.
        $yearCharges = $chargeQuery->orderBy('due_date')->get();

        $chargesBreakdown = $yearCharges->values()->map(function (Charge $charge, int $index) {
            return [
                'id' => $charge->id,
                'concept' => $charge->concept?->name ?? $charge->notes,
                'due_date' => optional($charge->due_date)->toDateString(),
                'installment_number' => $index + 1,
                'amount' => (float) $charge->amount,
                'discount_amount' => (float) $charge->discount_amount,
                'final_amount' => (float) $charge->final_amount,
                'status' => $charge->status,
            ];
        })->values();

        $annualSummary = [
            'total_charges' => $yearCharges->count(),
            'total_amount' => round((float) $yearCharges->sum('amount'), 2),
            'total_discount' => round((float) $yearCharges->sum('discount_amount'), 2),
            'total_final' => round((float) $yearCharges->sum('final_amount'), 2),
        ];

        $sampleCharge = $yearCharges->firstWhere('status', 'pendiente') ?? $yearCharges->first();

        return response()->json([
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'discounts' => $discounts,
            'total_percent' => $totalPercent,
            'total_fixed' => $totalFixed,
            'annual_summary' => $annualSummary,
            'charges_breakdown' => $chargesBreakdown,
            'sample_charge' => $sampleCharge ? [
                'id' => $sampleCharge->id,
                'concept' => $sampleCharge->concept?->name ?? $sampleCharge->notes,
                'amount' => (float) $sampleCharge->amount,
                'discount_amount' => (float) $sampleCharge->discount_amount,
                'final_amount' => (float) $sampleCharge->final_amount,
            ] : null,
        ]);
    }
}
