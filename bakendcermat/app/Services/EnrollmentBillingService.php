<?php

namespace App\Services;

use App\Exceptions\InstallmentSplitException;
use App\Models\Charge;
use App\Models\Discount;
use App\Models\FeeConcept;
use App\Models\Student;
use App\Models\StudentDiscount;
use App\Models\SystemSetting;
use Carbon\Carbon;

/**
 * Genera los cargos de una matricula recien aprobada, segun la modalidad de
 * pago elegida.
 *
 * CONTADO  -> 2 cargos, ambos con vencimiento el dia de la aprobacion:
 *             matricula + UN cargo consolidado con la pension anual completa.
 *             Se consolida a proposito: el indice unico parcial
 *             charges_unique_active_charge es (alumno, anio, concepto, fecha),
 *             asi que N pensiones con la misma fecha colisionarian entre si.
 *             Ademas, al cobrarse todo junto, un solo cargo = un solo recibo.
 *
 * CUOTAS   -> matricula + primera pension con vencimiento el dia de la
 *             aprobacion (se cobran de inmediato), y las N-1 pensiones
 *             restantes con vencimiento mensual segun el calendario
 *             configurado en system_settings.
 *
 * Ninguno de los dos marca nada como pagado: se generan cargos PENDIENTES y
 * secretaria confirma el pago real desde Finanzas -> Cuenta Corriente.
 */
class EnrollmentBillingService
{
    public function __construct(
        private readonly ChargeIssuanceService $chargeIssuance,
        private readonly InstallmentPlanCalculator $calculator,
        private readonly StudentDiscountService $studentDiscounts,
    ) {}

    /**
     * Concepto vigente para un tipo (pension / matricula).
     *
     * fee_concepts no tiene academic_year_id: hoy los conceptos de cada anio
     * solo se distinguen por el nombre ("pension 2026"). Adivinar por nombre
     * seria fragil, asi que la regla es explicita: debe haber exactamente UN
     * concepto activo por tipo. Si hay mas de uno, se pide al admin que
     * desactive el sobrante en vez de elegir por el.
     */
    public function resolveConcept(string $type): FeeConcept
    {
        $concepts = FeeConcept::query()
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if ($concepts->isEmpty()) {
            throw new InstallmentSplitException(
                "No hay un concepto activo de tipo '{$type}' en el Catalogo Financiero. Crealo antes de aprobar matriculas.",
                'payment_mode'
            );
        }

        if ($concepts->count() > 1) {
            throw new InstallmentSplitException(
                sprintf(
                    "Hay %d conceptos activos de tipo '%s' (%s). Deja activo solo el del anio en curso para poder generar los cargos.",
                    $concepts->count(),
                    $type,
                    $concepts->pluck('name')->implode(', ')
                ),
                'payment_mode'
            );
        }

        return $concepts->first();
    }

    /**
     * Cantidades de cuota que el admin habilito (system_settings).
     *
     * @return list<int>
     */
    public function installmentOptions(): array
    {
        $raw = (string) (SystemSetting::query()->where('key', 'installment_options')->value('value') ?? '3,4,5,8');

        $options = array_values(array_unique(array_filter(
            array_map(static fn ($v) => (int) trim($v), explode(',', $raw)),
            static fn (int $v) => $v >= 2
        )));

        sort($options);

        return $options;
    }

    /**
     * Primera fecha de vencimiento del calendario de pensiones.
     *
     * Es el maximo entre el dia configurado del mes configurado, y el dia
     * configurado del mes SIGUIENTE al de la aprobacion. El segundo termino es
     * el que hace que una matricula tardia no reciba cuotas ya vencidas: sin
     * el, un alumno matriculado en septiembre estrenaria con las cuotas de
     * marzo a agosto en mora.
     *
     * Se comparan fechas completas y no numeros de mes, para que una matricula
     * hecha en diciembre para el anio academico siguiente funcione sin casos
     * especiales de cruce de anio.
     */
    public function firstScheduledDueDate(Carbon $approvedAt, int $academicYear): Carbon
    {
        $dueDay = $this->pensionDueDay();

        $configured = Carbon::create($academicYear, $this->pensionFirstDueMonth(), $dueDay)->startOfDay();
        $earliest = $approvedAt->copy()->startOfMonth()->addMonthNoOverflow()->day($dueDay)->startOfDay();

        return $configured->greaterThan($earliest) ? $configured : $earliest;
    }

    /**
     * Cuantas cuotas caben sin que la ultima se salga del anio academico.
     * La primera cuota se cobra el dia de la aprobacion, por eso el +1.
     */
    public function maxInstallmentsThatFit(Carbon $approvedAt, int $academicYear): int
    {
        $start = $this->firstScheduledDueDate($approvedAt, $academicYear);
        $endOfYear = Carbon::create($academicYear, 12, 31)->endOfDay();

        if ($start->greaterThan($endOfYear)) {
            return 1;
        }

        $monthsAvailable = (int) $start->copy()->startOfMonth()->diffInMonths($endOfYear->copy()->startOfMonth()) + 1;

        return $monthsAvailable + 1;
    }

    /**
     * Fechas de vencimiento de las cuotas 2..N (la 1 vence el dia de la
     * aprobacion y no forma parte del calendario).
     *
     * @return list<Carbon>
     */
    public function scheduledDueDates(Carbon $approvedAt, int $academicYear, int $installments): array
    {
        $start = $this->firstScheduledDueDate($approvedAt, $academicYear);

        $dates = [];
        for ($i = 0; $i < $installments - 1; $i++) {
            $dates[] = $start->copy()->addMonthsNoOverflow($i);
        }

        return $dates;
    }

    /**
     * Valida la modalidad ANTES de aprobar, para que una eleccion imposible no
     * deje la matricula aprobada sin cargos.
     */
    public function validateSelection(string $paymentMode, ?int $installments, Carbon $approvedAt, int $academicYear): void
    {
        if ($paymentMode !== 'cuotas') {
            return;
        }

        $options = $this->installmentOptions();

        if (! in_array($installments, $options, true)) {
            throw new InstallmentSplitException(sprintf(
                'La cantidad de cuotas debe ser una de las habilitadas: %s.',
                implode(', ', $options)
            ));
        }

        $max = $this->maxInstallmentsThatFit($approvedAt, $academicYear);

        if ($installments > $max) {
            if ($max <= 1) {
                throw new InstallmentSplitException(sprintf(
                    'Ya no quedan meses del anio academico %d para programar cuotas (el calendario arrancaria el %s). Esta matricula solo puede registrarse como pago al contado.',
                    $academicYear,
                    $this->firstScheduledDueDate($approvedAt, $academicYear)->toDateString()
                ));
            }

            throw new InstallmentSplitException(sprintf(
                'Quedan %d meses del anio academico para programar cuotas: puedes elegir hasta %d cuotas.',
                $max - 1,
                $max
            ));
        }
    }

    /**
     * Genera los cargos de la matricula. Debe llamarse dentro de una
     * transaccion del controlador.
     *
     * @return array{payment_mode: string, installments_count: int|null, charges: list<Charge>, discount: array|null, total: float, due_today: float}
     */
    public function generateForApproval(
        Student $student,
        string $academicYearId,
        int $academicYear,
        string $paymentMode,
        ?int $installments,
        ?string $actorUserId,
        ?Carbon $approvedAt = null
    ): array {
        $approvedAt ??= Carbon::now();
        $today = $approvedAt->copy()->startOfDay();

        $matricula = $this->resolveConcept('matricula');
        $pension = $this->resolveConcept('pension');

        $charges = [];

        // La matricula se cobra igual en ambas modalidades, siempre hoy.
        $charges[] = $this->issue($student, $academicYearId, $matricula, 'matricula',
            (float) $matricula->base_amount, $today, 'Matricula - pago al aprobar la solicitud', $actorUserId);

        if ($paymentMode === 'contado') {
            // UN solo cargo con la pension anual completa (ver docblock de la clase).
            $charges[] = $this->issue($student, $academicYearId, $pension, 'pension',
                (float) $pension->base_amount, $today,
                'Pension anual completa - pago al contado', $actorUserId);
        } else {
            $montos = $this->calculator->split((float) $pension->base_amount, $installments);
            $fechas = $this->scheduledDueDates($approvedAt, $academicYear, $installments);

            foreach ($montos as $i => $monto) {
                $numero = $i + 1;
                // La cuota 1 vence hoy (se cobra de inmediato); las demas siguen
                // el calendario configurado.
                $vence = $numero === 1 ? $today : $fechas[$i - 1];

                $charges[] = $this->issue($student, $academicYearId, $pension, 'pension', $monto, $vence,
                    "Pension - cuota {$numero} de {$installments}", $actorUserId);
            }
        }

        $charges = array_values(array_filter($charges));

        // El descuento por pago al contado se registra como StudentDiscount
        // (queda auditado igual que hermanos/beca) y el recalculo compartido lo
        // aplica a los cargos recien creados. No se resta a mano del monto: el
        // cargo guarda su bruto en amount y el descuento en discount_amount,
        // que es lo que hace idempotente al recalculo.
        $discountInfo = null;

        if ($paymentMode === 'contado') {
            $discount = Discount::autoApplyForYear($academicYearId, 'contado');

            if ($discount) {
                $yaAsignado = StudentDiscount::where('student_id', $student->id)
                    ->where('discount_id', $discount->id)
                    ->where('academic_year_id', $academicYearId)
                    ->exists();

                if (! $yaAsignado) {
                    StudentDiscount::create([
                        'student_id' => $student->id,
                        'discount_id' => $discount->id,
                        'academic_year_id' => $academicYearId,
                        'notes' => 'Aplicado automaticamente al aprobar la matricula con pago al contado.',
                        'assigned_by' => $actorUserId,
                        'created_at' => now(),
                    ]);
                }

                $this->studentDiscounts->recalculateFor($student->id, $academicYearId);

                $discountInfo = [
                    'id' => $discount->id,
                    'name' => $discount->name,
                    'type' => $discount->type,
                    'value' => (float) $discount->value,
                    'concepts' => $discount->feeConcepts->pluck('name')->values()->all(),
                ];
            }
        }

        $frescos = Charge::whereIn('id', array_map(static fn (Charge $c) => $c->id, $charges))
            ->orderBy('due_date')
            ->get();

        return [
            'payment_mode' => $paymentMode,
            'installments_count' => $paymentMode === 'cuotas' ? $installments : null,
            'charges' => $frescos->values()->all(),
            'discount' => $discountInfo,
            'total' => round((float) $frescos->sum('final_amount'), 2),
            'due_today' => round((float) $frescos
                ->filter(fn (Charge $c) => $c->due_date <= $today)
                ->sum('final_amount'), 2),
        ];
    }

    private function issue(
        Student $student,
        string $academicYearId,
        FeeConcept $concept,
        string $type,
        float $amount,
        Carbon $dueDate,
        string $notes,
        ?string $actorUserId
    ): ?Charge {
        $payload = [
            'student_id' => $student->id,
            'academic_year_id' => $academicYearId,
            'concept_id' => $concept->id,
            'type' => $type,
            'status' => 'pendiente',
            'amount' => $amount,
            'discount_amount' => 0,
            'due_date' => $dueDate->toDateString(),
            'notes' => $notes,
        ];

        if ($this->chargeIssuance->supportsCreatedBy()) {
            $payload['created_by'] = $actorUserId;
        }

        return $this->chargeIssuance->issueIfAbsent($payload);
    }

    private function pensionFirstDueMonth(): int
    {
        $value = (int) (SystemSetting::query()->where('key', 'pension_first_due_month')->value('value') ?? 3);

        return max(1, min(12, $value));
    }

    private function pensionDueDay(): int
    {
        $value = (int) (SystemSetting::query()->where('key', 'pension_due_day')->value('value') ?? 5);

        return max(1, min(28, $value));
    }
}
