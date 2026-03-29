<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', Rule::in(['presente','tarde','falta','justificado'])],
            'justification'  => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
