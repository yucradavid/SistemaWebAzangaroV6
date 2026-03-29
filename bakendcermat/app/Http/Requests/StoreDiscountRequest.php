<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['porcentaje', 'monto_fijo'])],
            'value' => ['required', 'numeric', 'min:0'],
            'scope' => ['nullable', Rule::in(['todos', 'pension', 'matricula', 'especifico'])],
            'specific_concept_id' => ['nullable', 'uuid', 'exists:fee_concepts,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
