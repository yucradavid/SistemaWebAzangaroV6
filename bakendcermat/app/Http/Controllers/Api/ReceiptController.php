<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $q = Receipt::query();
        $issuedAtColumn = Receipt::issuedAtColumn();

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('payment_id')) {
            $q->where('payment_id', $request->payment_id);
        }

        return $q->orderByDesc($issuedAtColumn)->orderByDesc('created_at')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'payment_id' => ['required', 'uuid', 'exists:payments,id'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            /** @var Payment $payment */
            $payment = Payment::lockForUpdate()->findOrFail($data['payment_id']);

            $existing = Receipt::where('payment_id', $payment->id)->first();
            if ($existing) {
                return $existing->load('payment');
            }

            $insert = [
                'payment_id' => $payment->id,
                'student_id' => $payment->student_id,
                Receipt::numberColumn() => Receipt::nextNumber(),
                Receipt::issuedAtColumn() => now(),
                Receipt::totalColumn() => $payment->amount,
            ];

            if (Schema::hasColumn('receipts', 'issued_by') && $request->user()?->id) {
                $insert['issued_by'] = $request->user()->id;
            }

            $receipt = Receipt::create($insert);

            return response()->json($receipt->load('payment'), 201);
        });
    }

    public function show(Receipt $receipt)
    {
        return $receipt->load(['payment', 'student']);
    }

    public function destroy(Receipt $receipt)
    {
        $receipt->delete();

        return response()->noContent();
    }
}
