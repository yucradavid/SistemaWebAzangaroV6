<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecoveryProcessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'referral_reason' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'support_plan' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'started_at' => ['sometimes', 'nullable', 'date'],
            'ended_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
