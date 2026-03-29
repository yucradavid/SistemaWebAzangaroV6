<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecoveryProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'grade_level_id' => ['required', 'uuid', 'exists:grade_levels,id'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'referral_reason' => ['nullable', 'string', 'max:5000'],
            'support_plan' => ['nullable', 'string', 'max:5000'],
            'started_at' => ['nullable', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:started_at'],
        ];
    }
}
