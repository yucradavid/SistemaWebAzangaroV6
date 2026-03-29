<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCashClosureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'closure_date' => ['sometimes', 'date'],
            'opening_balance' => ['sometimes', 'numeric', 'min:0'],
            'cash_received' => ['sometimes', 'numeric', 'min:0'],
            'actual_balance' => ['sometimes', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'cashier_id' => ['nullable', 'uuid', 'exists:profiles,id'],
            'opening_time' => ['nullable', 'date'],
            'closing_time' => ['nullable', 'date'],
            'total_cash' => ['sometimes', 'numeric', 'min:0'],
            'total_cards' => ['sometimes', 'numeric', 'min:0'],
            'total_transfers' => ['sometimes', 'numeric', 'min:0'],
            'total_yape' => ['sometimes', 'numeric', 'min:0'],
            'total_plin' => ['sometimes', 'numeric', 'min:0'],
            'payments_count' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
