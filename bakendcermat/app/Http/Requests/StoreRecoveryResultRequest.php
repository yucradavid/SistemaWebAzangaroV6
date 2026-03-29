<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecoveryResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recovery_process_id' => ['required', 'uuid', 'exists:recovery_processes,id'],
            'competency_id' => ['required', 'uuid', 'exists:competencies,id'],
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
            'initial_level' => ['nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'recovery_level' => ['nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'final_level' => ['nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'is_resolved' => ['nullable', 'boolean'],
            'observations' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
