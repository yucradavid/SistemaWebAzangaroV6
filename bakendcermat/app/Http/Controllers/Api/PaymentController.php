<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Charge;
use App\Models\Payment;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $q = Payment::with(['charge.concept', 'student.section.gradeLevel', 'receipt']);
        $perPage = max(1, min((int) $request->integer('per_page', 50), 1000));
        $methodColumn = $this->paymentMethodColumn();
        $paidAtColumn = $this->paymentPaidAtColumn();

        if (!$request->boolean('include_voided')) {
            $q->whereNull('voided_at');
        }

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('charge_id')) {
            $q->where('charge_id', $request->charge_id);
        }

        if ($request->filled('method')) {
            $q->where($methodColumn, $request->method);
        }

        if ($request->filled('date_from')) {
            $q->whereDate($paidAtColumn, '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $q->whereDate($paidAtColumn, '<=', $request->date_to);
        }

        return $q->orderByDesc($paidAtColumn)->orderByDesc('created_at')->paginate($perPage);
    }

    public function store(StorePaymentRequest $request)
    {
        $data = $request->validated();
        $actorId = $this->resolveAuthSchemaUserId($request);

        return DB::transaction(function () use ($data, $request, $actorId) {
            if (empty($data['charge_id'] ?? null)) {
                $payment = Payment::create(
                    $this->buildPaymentInsert(
                        $data,
                        (float) $data['amount'],
                        $actorId
                    )
                );

                return response()->json(
                    $payment->load(['charge.concept', 'student.section.gradeLevel', 'receipt']),
                    201
                );
            }

            /** @var Charge $charge */
            $charge = Charge::lockForUpdate()->findOrFail($data['charge_id']);

            if (!empty($data['student_id']) && $data['student_id'] !== $charge->student_id) {
                return response()->json([
                    'message' => 'El estudiante del pago no coincide con el cargo seleccionado.',
                ], 422);
            }

            $alreadyPaid = (float) ($charge->paid_amount ?? 0);
            $total = (float) $charge->amount;
            $discount = (float) ($charge->discount_amount ?? 0);
            $netTotal = max(0, $total - $discount);
            $remaining = max(0, $netTotal - $alreadyPaid);

            if ($remaining <= 0) {
                return response()->json(['message' => 'El cargo ya se encuentra pagado.'], 422);
            }

            $amountToPay = min((float) $data['amount'], $remaining);
            $newPaid = $alreadyPaid + $amountToPay;

            if ($amountToPay <= 0) {
                return response()->json(['message' => 'Monto invalido.'], 422);
            }

            $payment = Payment::create(
                $this->buildPaymentInsert(
                    $data,
                    $amountToPay,
                    $actorId,
                    $charge
                )
            );
            $this->ensureReceiptExists($payment, $actorId);

            $status = $newPaid >= $netTotal ? 'pagado' : 'pagado_parcial';

            $chargeUpdate = ['status' => $status];

            if (Schema::hasColumn('charges', 'paid_amount')) {
                $chargeUpdate['paid_amount'] = min($newPaid, $netTotal);
            }

            $charge->update($chargeUpdate);

            return response()->json(
                $payment->load(['charge.concept', 'student.section.gradeLevel', 'receipt']),
                201
            );
        });
    }

    public function show(Payment $payment)
    {
        return $payment->load(['charge.concept', 'student.section.gradeLevel', 'receipt']);
    }

    public function destroy(Payment $payment)
    {
        return DB::transaction(function () use ($payment) {
            $charge = $payment->charge_id
                ? Charge::lockForUpdate()->find($payment->charge_id)
                : null;

            if ($payment->receipt) {
                $payment->receipt->delete();
            }

            $payment->delete();

            if ($charge) {
                $this->recalculateChargeState($charge);
            }

            return response()->noContent();
        });
    }

    public function void(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        return DB::transaction(function () use ($request, $payment, $data) {
            /** @var Payment $lockedPayment */
            $lockedPayment = Payment::lockForUpdate()->findOrFail($payment->id);

            if ($lockedPayment->voided_at) {
                return response()->json([
                    'message' => 'El pago ya fue anulado previamente.',
                ], 422);
            }

            $charge = $lockedPayment->charge_id
                ? Charge::lockForUpdate()->find($lockedPayment->charge_id)
                : null;

            $lockedPayment->update([
                'voided_at' => now(),
                'voided_by' => $this->resolveAuthSchemaUserId($request),
                'void_reason' => $data['reason'],
            ]);

            if ($charge) {
                $this->recalculateChargeState($charge);
            }

            return response()->json([
                'message' => 'Pago anulado correctamente.',
                'data' => $lockedPayment->fresh()->load(['charge.concept', 'student.section.gradeLevel', 'receipt']),
            ]);
        });
    }

    private function ensureReceiptExists(Payment $payment, ?string $issuedBy = null): void
    {
        if (Receipt::where('payment_id', $payment->id)->exists()) {
            return;
        }

        $receiptNumber = Receipt::nextNumber();
        $issuedAt = now();
        $insert = [
            'payment_id' => $payment->id,
            'student_id' => $payment->student_id,
        ];

        $this->fillReceiptNumberFields($insert, $receiptNumber);
        $this->fillReceiptIssuedAtFields($insert, $issuedAt);
        $this->fillReceiptTotalFields($insert, (float) $payment->amount);

        if (Schema::hasColumn('receipts', 'issued_by') && $issuedBy) {
            $insert['issued_by'] = $issuedBy;
        }

        Receipt::create($insert);
    }

    private function buildPaymentInsert(
        array $data,
        float $amount,
        ?string $receivedBy = null,
        ?Charge $charge = null
    ): array {
        $paidAt = $data['paid_at'] ?? now();
        $insert = [
            'charge_id' => $charge?->id,
            'student_id' => $charge?->student_id ?? ($data['student_id'] ?? null),
            'amount' => $amount,
            'notes' => $data['notes'] ?? null,
        ];

        $this->fillPaymentMethodFields($insert, (string) $data['method']);
        $this->fillPaymentDateFields($insert, $paidAt);
        $this->fillPaymentReferenceFields($insert, $data['reference'] ?? null);

        if (Schema::hasColumn('payments', 'received_by') && $receivedBy) {
            $insert['received_by'] = $receivedBy;
        }

        return $insert;
    }

    private function recalculateChargeState(Charge $charge): void
    {
        $paidAmount = (float) Payment::query()
            ->where('charge_id', $charge->id)
            ->whereNull('voided_at')
            ->sum('amount');
        $netTotal = max(0, (float) $charge->amount - (float) ($charge->discount_amount ?? 0));

        if ($charge->voided_at) {
            $charge->update([
                'paid_amount' => 0,
            ]);
            return;
        }

        $status = 'pendiente';
        if ($paidAmount > 0 && $paidAmount < $netTotal) {
            $status = 'pagado_parcial';
        } elseif ($paidAmount >= $netTotal && $netTotal > 0) {
            $status = 'pagado';
            $paidAmount = $netTotal;
        }

        $charge->update([
            'paid_amount' => $paidAmount,
            'status' => $status,
        ]);
    }

    private function paymentMethodColumn(): string
    {
        return Schema::hasColumn('payments', 'method') ? 'method' : 'payment_method';
    }

    private function paymentReferenceColumn(): string
    {
        return Schema::hasColumn('payments', 'reference') ? 'reference' : 'transaction_ref';
    }

    private function paymentPaidAtColumn(): string
    {
        return Schema::hasColumn('payments', 'paid_at') ? 'paid_at' : 'payment_date';
    }

    private function fillPaymentMethodFields(array &$insert, string $method): void
    {
        if (Schema::hasColumn('payments', 'method')) {
            $insert['method'] = $method;
        }

        if (Schema::hasColumn('payments', 'payment_method')) {
            $insert['payment_method'] = $method;
        }
    }

    private function fillPaymentReferenceFields(array &$insert, ?string $reference): void
    {
        if (!filled($reference)) {
            return;
        }

        if (Schema::hasColumn('payments', 'reference')) {
            $insert['reference'] = $reference;
        }

        if (Schema::hasColumn('payments', 'transaction_ref')) {
            $insert['transaction_ref'] = $reference;
        }
    }

    private function fillPaymentDateFields(array &$insert, mixed $paidAt): void
    {
        if (Schema::hasColumn('payments', 'paid_at')) {
            $insert['paid_at'] = $paidAt;
        }

        if (Schema::hasColumn('payments', 'payment_date')) {
            $insert['payment_date'] = $paidAt;
        }
    }

    private function fillReceiptNumberFields(array &$insert, string $number): void
    {
        if (Schema::hasColumn('receipts', 'number')) {
            $insert['number'] = $number;
        }

        if (Schema::hasColumn('receipts', 'receipt_number')) {
            $insert['receipt_number'] = $number;
        }
    }

    private function fillReceiptTotalFields(array &$insert, float $total): void
    {
        if (Schema::hasColumn('receipts', 'total')) {
            $insert['total'] = $total;
        }

        if (Schema::hasColumn('receipts', 'total_amount')) {
            $insert['total_amount'] = $total;
        }
    }

    private function fillReceiptIssuedAtFields(array &$insert, mixed $issuedAt): void
    {
        if (Schema::hasColumn('receipts', 'issued_at')) {
            $insert['issued_at'] = $issuedAt;
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
