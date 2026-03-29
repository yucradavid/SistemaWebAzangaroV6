<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'discount_id' => ['required', 'uuid', 'exists:discounts,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
