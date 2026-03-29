<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecoveryResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'initial_level' => ['sometimes', 'nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'recovery_level' => ['sometimes', 'nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'final_level' => ['sometimes', 'nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'is_resolved' => ['sometimes', 'boolean'],
            'observations' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
