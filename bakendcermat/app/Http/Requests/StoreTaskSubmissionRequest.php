<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskSubmissionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'assignment_id'    => ['required', 'uuid', 'exists:assignments,id'],
            'student_id'       => ['required', 'uuid', 'exists:students,id'],

            'content'          => ['nullable', 'string'],
            'attachment_url'   => ['nullable', 'string'],
            'attachment_name'  => ['nullable', 'string', 'max:255'],
            'attachment_size'  => ['nullable', 'integer', 'min:0'],

            'status'           => ['nullable', 'in:submitted,draft,late,missing,graded'],
        ];
    }
}
