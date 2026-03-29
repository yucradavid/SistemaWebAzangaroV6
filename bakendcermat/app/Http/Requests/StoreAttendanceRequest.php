<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'course_id'  => ['required', 'uuid', 'exists:courses,id'],
            'section_id' => ['required', 'uuid', 'exists:sections,id'],

            'date'   => ['required', 'date'],
            'status' => ['required', 'string', Rule::in(['presente','tarde','falta','justificado'])],
            'justification'  => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'El estudiante es obligatorio.',
            'course_id.required'  => 'El curso es obligatorio.',
            'section_id.required' => 'La sección es obligatoria.',
            'status.in'           => 'Estado inválido.',
        ];
    }
}
