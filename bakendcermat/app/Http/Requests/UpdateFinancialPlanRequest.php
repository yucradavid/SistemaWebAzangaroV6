<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFinancialPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'concept_id' => ['sometimes', 'uuid', 'exists:fee_concepts,id'],
            'number_of_installments' => ['sometimes', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
