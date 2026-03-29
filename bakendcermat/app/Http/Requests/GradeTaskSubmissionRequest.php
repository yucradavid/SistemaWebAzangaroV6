<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GradeTaskSubmissionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'grade'        => ['required', 'numeric', 'min:0'],
            'grade_letter' => ['nullable', 'string', 'max:5'],
            'feedback'     => ['nullable', 'string'],
            'status'       => ['nullable', 'in:graded,submitted'],
        ];
    }
}
