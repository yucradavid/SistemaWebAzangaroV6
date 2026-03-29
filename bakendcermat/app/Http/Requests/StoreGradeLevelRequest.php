<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGradeLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'level' => strtolower(trim((string) $this->input('level'))),
            'name' => trim((string) $this->input('name')),
            'grade' => $this->input('grade') !== null ? (int) $this->input('grade') : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'level' => ['required', Rule::in(['inicial', 'primaria', 'secundaria'])],
            'grade' => [
                'required',
                'integer',
                'min:1',
                'max:12',
                Rule::unique('grade_levels', 'grade')->where(
                    fn ($query) => $query->where('level', $this->input('level'))
                ),
            ],
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('grade_levels', 'name')->where(
                    fn ($query) => $query->where('level', $this->input('level'))
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'level.required' => 'El nivel educativo es obligatorio.',
            'level.in' => 'El nivel educativo seleccionado no es valido.',
            'grade.required' => 'El orden numerico es obligatorio.',
            'grade.integer' => 'El orden numerico debe ser un numero entero.',
            'grade.min' => 'El orden numerico debe ser mayor a 0.',
            'grade.max' => 'El orden numerico no puede ser mayor a 12.',
            'grade.unique' => 'Ese orden numerico ya existe en este nivel.',
            'name.required' => 'El nombre del grado es obligatorio.',
            'name.max' => 'El nombre del grado no puede superar los 120 caracteres.',
            'name.unique' => 'Ya existe un grado con ese nombre en este nivel.',
        ];
    }
}
