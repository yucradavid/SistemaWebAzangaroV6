<?php

namespace App\Http\Requests;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $current = Section::find($this->route('section'));
        $letter = strtoupper(trim((string) ($this->input('section_letter') ?: $this->input('name') ?: $current?->section_letter)));

        $this->merge([
            'academic_year_id' => $this->input('academic_year_id', $current?->academic_year_id),
            'grade_level_id' => $this->input('grade_level_id', $current?->grade_level_id),
            'section_letter' => $letter,
            'name' => $letter,
            'capacity' => $this->input('capacity', $current?->capacity) !== null
                ? (int) $this->input('capacity', $current?->capacity)
                : null,
        ]);
    }

    public function rules(): array
    {
        $id = $this->route('section');

        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'grade_level_id' => ['required', 'uuid', 'exists:grade_levels,id'],
            'section_letter' => [
                'required',
                'string',
                'max:5',
                Rule::unique('sections', 'section_letter')
                    ->where(fn ($query) => $query
                        ->where('academic_year_id', $this->academic_year_id)
                        ->where('grade_level_id', $this->grade_level_id))
                    ->ignore($id),
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:80'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_year_id.required' => 'Debe seleccionar un ano academico.',
            'academic_year_id.exists' => 'El ano academico seleccionado no existe.',
            'grade_level_id.required' => 'Debe seleccionar un grado.',
            'grade_level_id.exists' => 'El grado seleccionado no existe.',
            'section_letter.required' => 'La letra de la seccion es obligatoria.',
            'section_letter.max' => 'La letra o codigo de la seccion no puede superar 5 caracteres.',
            'section_letter.unique' => 'Ya existe una seccion con esa letra en el mismo grado y ano academico.',
            'capacity.required' => 'La capacidad es obligatoria.',
            'capacity.integer' => 'La capacidad debe ser un numero entero.',
            'capacity.min' => 'La capacidad debe ser mayor a 0.',
            'capacity.max' => 'La capacidad no puede superar 80.',
        ];
    }
}
