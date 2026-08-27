<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\FinancialPlan;
use App\Models\StudentDiscount;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentFinancialAccountService
{
    public function assignDiscount(
        string $studentId,
        string $discountId,
        string $academicYearId,
        ?string $assignedBy = null,
        ?string $notes = null
    ): StudentDiscount {
        $studentDiscount = StudentDiscount::firstOrCreate(
            [
                'student_id' => $studentId,
                'discount_id' => $discountId,
                'academic_year_id' => $academicYearId,
            ],
            [
                'assigned_by' => $assignedBy,
                'notes' => $notes,
                'created_at' => now(),
            ]
        );

        $this->recalculateDiscountsForStudent($studentId, $academicYearId);

        return $studentDiscount;
    }

    public function generateChargesForStudent(
        string $studentId,
        FinancialPlan $plan,
        string $academicYearId,
        ?string $createdBy = null
    ): array {
        $plan->loadMissing(['installments', 'concept']);

        $chargeType = in_array($plan->concept?->type, ['matricula', 'pension'], true)
            ? $plan->concept->type
            : 'otro';

        $createdCount = 0;
        $skippedCount = 0;

        DB::transaction(function () use ($studentId, $plan, $academicYearId, $chargeType, $createdBy, &$createdCount, &$skippedCount) {
            foreach ($plan->installments as $installment) {
                $exists = Charge::where('student_id', $studentId)
                    ->where('academic_year_id', $academicYearId)
                    ->where('concept_id', $plan->concept_id)
                    ->whereDate('due_date', $installment->due_date)
                    ->whereNull('voided_at')
                    ->exists();

                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                $payload = [
                    'student_id' => $studentId,
                    'academic_year_id' => $academicYearId,
                    'concept_id' => $plan->concept_id,
                    'type' => $chargeType,
                    'status' => 'pendiente',
                    'amount' => (float) $installment->amount,
                    'discount_amount' => 0,
                    'paid_amount' => 0,
                    'due_date' => $installment->due_date,
                    'notes' => "Generado automaticamente - {$plan->name} - Cuota #{$installment->installment_number}",
                ];

                if (Schema::hasColumn('charges', 'created_by')) {
                    $payload['created_by'] = $createdBy;
                }

                try {
                    Charge::create($this->buildChargeInsert($payload));
                    $createdCount++;
                } catch (QueryException $e) {
                    if ($e->getCode() === '23505') {
                        $skippedCount++;
                        continue;
                    }

                    throw $e;
                }
            }
        });

        $this->recalculateDiscountsForStudent($studentId, $academicYearId);

        return [
            'created_count' => $createdCount,
            'skipped_count' => $skippedCount,
        ];
    }

    public function recalculateDiscountsForStudent(string $studentId, string $academicYearId): void
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
            $applicable = $activeDiscounts->filter(function (StudentDiscount $studentDiscount) use ($charge) {
                $discount = $studentDiscount->discount;

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
                ->filter(fn (StudentDiscount $studentDiscount) => $studentDiscount->discount->type === 'porcentaje')
                ->sum(fn (StudentDiscount $studentDiscount) => (float) $studentDiscount->discount->value);

            $fixedSum = (float) $applicable
                ->filter(fn (StudentDiscount $studentDiscount) => $studentDiscount->discount->type === 'monto_fijo')
                ->sum(fn (StudentDiscount $studentDiscount) => (float) $studentDiscount->discount->value);

            $amount = (float) $charge->amount;
            $discountFromPercent = round($amount * $percentSum / 100, 2);
            $totalDiscount = min($amount, $discountFromPercent + $fixedSum);

            $update = [
                'discount_amount' => $totalDiscount,
            ];

            if (Schema::hasColumn('charges', 'final_amount')) {
                $update['final_amount'] = max(0, $amount - $totalDiscount);
            }

            $charge->update($update);
        }
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
}
