<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grade'  => ['sometimes', 'string', Rule::in(['AD','A','B','C'])],
            'status' => ['sometimes', 'string', Rule::in(['borrador','publicada','cerrada'])],

            'comments' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'observations' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'grade.in'  => 'La nota debe ser AD, A, B o C.',
            'status.in' => 'El estado debe ser borrador, publicada o cerrada.',
        ];
    }
}
