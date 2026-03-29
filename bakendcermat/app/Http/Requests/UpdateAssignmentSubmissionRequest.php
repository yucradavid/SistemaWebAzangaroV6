<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssignmentSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'submission_text' => ['nullable', 'string'],
            'attachment_url' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', Rule::in(['pendiente', 'entregado', 'revisado'])],
            'feedback' => ['nullable', 'string'],
            'score' => ['nullable', 'integer', 'min:0', 'max:20'],
        ];
    }
}
