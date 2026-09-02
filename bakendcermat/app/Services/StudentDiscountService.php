<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\StudentDiscount;
use Illuminate\Support\Facades\Schema;

/**
 * Unico lugar donde se recalcula cuanto descuento le corresponde a los cargos
 * pendientes de un alumno.
 *
 * Lo usan la asignacion manual de descuentos (StudentDiscountController) y la
 * aprobacion de matricula en modalidad contado (EnrollmentBillingService). Si
 * cada uno hiciera su propia cuenta, un alumno podria terminar con descuentos
 * distintos segun por donde se le asignaron.
 */
class StudentDiscountService
{
    /**
     * Recalcula discount_amount / final_amount de los cargos PENDIENTES de un
     * alumno sumando TODOS sus descuentos activos que le apliquen.
     *
     * Que descuento afecta a que cargo lo decide Discount::appliesTo(): lista
     * explicita de conceptos si el descuento la tiene, y si no, el scope de
     * siempre (todos / pension / matricula / especifico).
     *
     * Los porcentajes se suman entre si (10% + 20% = 30%) y se calculan sobre
     * el monto BRUTO del cargo; los de monto_fijo se suman en soles. El
     * descuento total nunca supera el monto del cargo.
     *
     * Al calcularse siempre sobre el bruto y no sobre el saldo, el metodo es
     * idempotente: correrlo dos veces da el mismo resultado, y por eso el
     * cargo debe guardarse con su monto bruto en amount y el descuento aparte
     * en discount_amount, nunca ya restado.
     */
    public function recalculateFor(string $studentId, string $academicYearId): void
    {
        $activeDiscounts = StudentDiscount::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->whereHas('discount', fn ($q) => $q->where('is_active', true))
            ->with('discount.feeConcepts')
            ->get();

        $charges = Charge::where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'pendiente')
            ->whereNull('voided_at')
            ->get();

        foreach ($charges as $charge) {
            $applicable = $activeDiscounts->filter(
                fn (StudentDiscount $sd) => $sd->discount?->appliesTo($charge->type, $charge->concept_id) === true
            );

            $percentSum = (float) $applicable
                ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'porcentaje')
                ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

            $fixedSum = (float) $applicable
                ->filter(fn (StudentDiscount $sd) => $sd->discount->type === 'monto_fijo')
                ->sum(fn (StudentDiscount $sd) => (float) $sd->discount->value);

            $amount = (float) $charge->amount;
            $discountFromPercent = round($amount * $percentSum / 100, 2);
            $totalDiscount = min($amount, $discountFromPercent + $fixedSum);

            $update = ['discount_amount' => $totalDiscount];

            if (Schema::hasColumn('charges', 'final_amount')) {
                $update['final_amount'] = max(0, $amount - $totalDiscount);
            }

            $charge->update($update);
        }
    }
}
