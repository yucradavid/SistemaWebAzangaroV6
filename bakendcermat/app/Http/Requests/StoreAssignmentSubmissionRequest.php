<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assignment_id' => ['required', 'uuid', 'exists:assignments,id'],
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'submission_text' => ['nullable', 'string'],
            'attachment_url' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', Rule::in(['pendiente', 'entregado', 'revisado'])],
        ];
    }
}
