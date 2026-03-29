<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_id' => ['sometimes', 'uuid', 'exists:courses,id'],
            'section_id' => ['sometimes', 'uuid', 'exists:sections,id'],

            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],

            'due_date'     => ['sometimes', 'nullable', 'date'],
            'max_score'    => ['sometimes', 'nullable', 'numeric'],
            'instructions' => ['sometimes', 'nullable', 'string'],
            'status'       => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'course_id.uuid' => 'El course_id debe ser un UUID válido.',
            'course_id.exists' => 'El curso no existe.',
            'section_id.uuid' => 'El section_id debe ser un UUID válido.',
            'section_id.exists' => 'La sección no existe.',
            'title.max' => 'El título no puede exceder 255 caracteres.',
            'due_date.date' => 'La fecha de entrega no tiene un formato válido.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('title')) {
            $this->merge([
                'title' => trim((string)$this->input('title')),
            ]);
        }
    }
}
