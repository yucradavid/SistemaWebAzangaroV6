<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAssignmentSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'score' => ['nullable', 'integer', 'min:0', 'max:20'],
            'feedback' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['revisado'])],
        ];
    }
}
