<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskSubmissionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // no permitimos cambiar assignment_id ni student_id en update
            'content'          => ['sometimes', 'nullable', 'string'],
            'attachment_url'   => ['sometimes', 'nullable', 'string'],
            'attachment_name'  => ['sometimes', 'nullable', 'string', 'max:255'],
            'attachment_size'  => ['sometimes', 'nullable', 'integer', 'min:0'],

            'status'           => ['sometimes', 'in:submitted,draft,late,missing,graded'],
        ];
    }
}
