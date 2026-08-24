<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCashClosureRequest;
use App\Http\Requests\UpdateCashClosureRequest;
use App\Models\CashClosure;
use App\Models\CashOpeningBalance;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class CashClosureController extends Controller
{
    public function index(Request $request)
    {
        $q = CashClosure::with(['closedBy', 'cashier']);

        if ($request->filled('closure_date')) {
            $q->whereDate('closure_date', $request->closure_date);
        }

        if ($request->filled('cashier_id')) {
            $q->where('cashier_id', $request->cashier_id);
        }

        return $q->orderByDesc('closure_date')->orderByDesc('created_at')->paginate(50);
    }

    public function store(StoreCashClosureRequest $request)
    {
        $data = $request->validated();

        $closureDate = $data['closure_date'] ?? now()->toDateString();
        $openingBalance = (float) ($data['opening_balance'] ?? 0);
        $actualBalance = (float) ($data['actual_balance'] ?? 0);

        $exists = CashClosure::whereDate('closure_date', $closureDate)
            ->where('closed_by', optional($request->user())->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe un cierre de caja para esa fecha y usuario.'
            ], 422);
        }

        $summary = $this->summarizePaymentsForDate($closureDate);
        $expectedBalance = $openingBalance + $summary['cash'];
        $difference = $actualBalance - $expectedBalance;

        $cashClosure = CashClosure::create([
            'closure_date' => $closureDate,
            'opening_balance' => $openingBalance,
            'cash_received' => $summary['cash'],
            'expected_balance' => $expectedBalance,
            'actual_balance' => $actualBalance,
            'difference' => $difference,
            'notes' => $data['notes'] ?? null,
            'closed_by' => optional($request->user())->id,
            'cashier_id' => $data['cashier_id'] ?? null,
            'opening_time' => $data['opening_time'] ?? null,
            'closing_time' => $data['closing_time'] ?? now(),
            'total_cash' => $summary['cash'],
            'total_cards' => $summary['cards'],
            'total_transfers' => $summary['transfers'],
            'total_yape' => $summary['yape'],
            'total_plin' => $summary['plin'],
            'total_amount' => $summary['total'],
            'payments_count' => $summary['count'],
            'created_at' => now(),
        ]);

        return response()->json($cashClosure->load(['closedBy', 'cashier']), 201);
    }

    public function show(CashClosure $cashClosure)
    {
        return $cashClosure->load(['closedBy', 'cashier']);
    }

    public function update(UpdateCashClosureRequest $request, CashClosure $cashClosure)
    {
        $data = $request->validated();

        $openingBalance = (float) ($data['opening_balance'] ?? $cashClosure->opening_balance ?? 0);
        $cashReceived = (float) ($data['cash_received'] ?? $cashClosure->cash_received ?? 0);
        $actualBalance = (float) ($data['actual_balance'] ?? $cashClosure->actual_balance ?? 0);

        $data['expected_balance'] = $openingBalance + $cashReceived;
        $data['difference'] = $actualBalance - $data['expected_balance'];

        $totalCash = (float) ($data['total_cash'] ?? $cashClosure->total_cash ?? 0);
        $totalCards = (float) ($data['total_cards'] ?? $cashClosure->total_cards ?? 0);
        $totalTransfers = (float) ($data['total_transfers'] ?? $cashClosure->total_transfers ?? 0);
        $totalYape = (float) ($data['total_yape'] ?? $cashClosure->total_yape ?? 0);
        $totalPlin = (float) ($data['total_plin'] ?? $cashClosure->total_plin ?? 0);

        $data['total_amount'] = $totalCash + $totalCards + $totalTransfers + $totalYape + $totalPlin;

        $cashClosure->update($data);

        return $cashClosure->load(['closedBy', 'cashier']);
    }

    public function destroy(CashClosure $cashClosure)
    {
        $cashClosure->delete();
        return response()->noContent();
    }

    /**
     * Devuelve el ajuste manual de saldo inicial guardado para una fecha
     * (dia que todavia no tiene fila en cash_closures porque no se cerro).
     */
    public function openingBalance(Request $request)
    {
        $date = $request->query('date') ?: now()->toDateString();

        $override = CashOpeningBalance::whereDate('closure_date', $date)->first();

        return response()->json([
            'closure_date' => $date,
            'amount' => $override ? (float) $override->amount : null,
        ]);
    }

    /**
     * Persiste el ajuste manual de saldo inicial para una fecha sin cierre.
     * Antes de este endpoint, "Ajustar saldo inicial" en Caja Diaria solo
     * mutaba estado local del componente y se perdia al recargar la pagina.
     */
    public function updateOpeningBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $data = $validator->validated();
        $closureDate = $data['date'] ?? now()->toDateString();

        if (CashClosure::whereDate('closure_date', $closureDate)->exists()) {
            return response()->json([
                'message' => 'La caja de esa fecha ya fue cerrada, no se puede ajustar el saldo inicial.'
            ], 422);
        }

        $override = CashOpeningBalance::updateOrCreate(
            ['closure_date' => $closureDate],
            [
                'amount' => $data['amount'],
                'updated_by' => $this->resolveActorUserId($request),
            ]
        );

        return response()->json([
            'closure_date' => $closureDate,
            'amount' => (float) $override->amount,
        ]);
    }

    private function resolveActorUserId(Request $request): ?string
    {
        $authUser = $request->user();

        if (!$authUser) {
            return null;
        }

        // cash_opening_balances.updated_by referencia public.users.id (igual que
        // cash_closures.closed_by, ver 2026_06_14_000002). El usuario autenticado
        // por Sanctum ES la fila de public.users, no la de auth.users.
        $candidateIds = array_values(array_filter([
            $authUser->getKey(),
            $authUser->id ?? null,
            $authUser->profile?->user_id ?? null,
        ]));

        foreach ($candidateIds as $candidateId) {
            $candidateId = (string) $candidateId;

            if ($candidateId !== '' && DB::table('users')->where('id', $candidateId)->exists()) {
                return $candidateId;
            }
        }

        $emailCandidates = array_values(array_filter([
            $authUser->email ?? null,
            $authUser->profile?->email ?? null,
        ]));

        foreach ($emailCandidates as $email) {
            $publicUserId = DB::table('users')
                ->whereRaw('lower(email) = ?', [strtolower((string) $email)])
                ->value('id');

            if ($publicUserId) {
                return (string) $publicUserId;
            }
        }

        return null;
    }

    private function summarizePaymentsForDate(string $closureDate): array
    {
        $paidAtColumn = Schema::hasColumn('payments', 'paid_at') ? 'paid_at' : 'payment_date';
        $payments = Payment::query()
            ->whereDate($paidAtColumn, $closureDate)
            ->get();

        $summary = [
            'cash' => 0.0,
            'cards' => 0.0,
            'transfers' => 0.0,
            'yape' => 0.0,
            'plin' => 0.0,
            'count' => $payments->count(),
            'total' => 0.0,
        ];

        foreach ($payments as $payment) {
            $amount = (float) $payment->amount;
            $notes = mb_strtoupper((string) ($payment->notes ?? ''));
            $method = strtolower((string) ($payment->method ?? 'efectivo'));

            if (str_contains($notes, '(EGRESO)')) {
                $summary['cash'] -= $amount;
                continue;
            }

            switch ($method) {
                case 'tarjeta':
                    $summary['cards'] += $amount;
                    break;
                case 'transferencia':
                case 'pasarela':
                    $summary['transfers'] += $amount;
                    break;
                case 'yape':
                    $summary['yape'] += $amount;
                    break;
                case 'plin':
                    $summary['plin'] += $amount;
                    break;
                default:
                    $summary['cash'] += $amount;
                    break;
            }
        }

        $summary['total'] = $summary['cash']
            + $summary['cards']
            + $summary['transfers']
            + $summary['yape']
            + $summary['plin'];

        return $summary;
    }
}
