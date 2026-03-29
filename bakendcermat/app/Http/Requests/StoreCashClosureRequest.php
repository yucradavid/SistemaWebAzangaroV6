<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCashClosureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'closure_date' => ['nullable', 'date'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'cash_received' => ['required', 'numeric', 'min:0'],
            'actual_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'cashier_id' => ['nullable', 'uuid', 'exists:profiles,id'],
            'opening_time' => ['nullable', 'date'],
            'closing_time' => ['nullable', 'date'],
            'total_cash' => ['nullable', 'numeric', 'min:0'],
            'total_cards' => ['nullable', 'numeric', 'min:0'],
            'total_transfers' => ['nullable', 'numeric', 'min:0'],
            'total_yape' => ['nullable', 'numeric', 'min:0'],
            'total_plin' => ['nullable', 'numeric', 'min:0'],
            'payments_count' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
