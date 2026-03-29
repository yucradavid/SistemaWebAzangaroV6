<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'charge_id' => ['nullable', 'uuid', 'exists:charges,id'],
            'student_id' => ['nullable', 'uuid', 'exists:students,id'],

            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string', Rule::in(['efectivo', 'transferencia', 'tarjeta', 'yape', 'plin', 'pasarela'])],

            'reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
