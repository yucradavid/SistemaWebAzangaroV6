<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

public function rules(): array
{
    return [
        'course_id' => ['required','uuid','exists:courses,id'],
        'section_id' => ['required','uuid','exists:sections,id'],
        'title' => ['required','string','max:255'],
        'description' => ['nullable','string'],
        'instructions' => ['nullable','string'],
        'due_date' => ['nullable','date'],
        'max_score' => ['nullable','numeric'],
        'attachment_url' => ['nullable','string']
    ];
}

    public function messages(): array
    {
        return [
            'course_id.required'  => 'El curso es obligatorio.',
            'course_id.uuid'      => 'El course_id debe ser un UUID válido.',
            'course_id.exists'    => 'El curso no existe.',

            'section_id.required' => 'La sección es obligatoria.',
            'section_id.uuid'     => 'El section_id debe ser un UUID válido.',
            'section_id.exists'   => 'La sección no existe.',

            'title.required'      => 'El título es obligatorio.',
            'title.max'           => 'El título no puede exceder 255 caracteres.',

            'due_date.date'       => 'La fecha de entrega no tiene un formato válido.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('title')) {
            $this->merge([
                'title' => trim((string) $this->input('title')),
            ]);
        }
    }
}
