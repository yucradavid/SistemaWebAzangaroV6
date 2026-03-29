<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDescriptiveConclusionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'competency_id' => ['required', 'uuid', 'exists:competencies,id'],
            'period_id' => ['required', 'uuid', 'exists:periods,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'achievement_level' => ['required', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'conclusion_text' => ['required', 'string', 'max:5000'],
            'difficulties' => ['nullable', 'string', 'max:5000'],
            'recommendations' => ['nullable', 'string', 'max:5000'],
            'support_actions' => ['nullable', 'string', 'max:5000'],
            'needs_support' => ['nullable', 'boolean'],
        ];
    }
}
