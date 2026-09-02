<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in(['porcentaje', 'monto_fijo'])],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'scope' => ['sometimes', Rule::in(['todos', 'pension', 'matricula', 'especifico'])],
            'specific_concept_id' => ['nullable', 'uuid', 'exists:fee_concepts,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'academic_year_id' => ['nullable', 'uuid', 'exists:academic_years,id', 'required_with:auto_apply_on'],
            'auto_apply_on' => ['nullable', Rule::in(['contado'])],
            'fee_concept_ids' => ['nullable', 'array'],
            'fee_concept_ids.*' => ['uuid', 'exists:fee_concepts,id'],
        ];
    }
}
