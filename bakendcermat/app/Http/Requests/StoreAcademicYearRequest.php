<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'year'       => ['required', 'integer', 'min:1900', 'max:2100',
                              Rule::unique('academic_years', 'year')],
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after:start_date'],
            'is_active'  => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'year.required'       => 'El año es requerido.',
            'year.integer'        => 'El año debe ser un número entero.',
            'year.min'            => 'El año no puede ser menor a 1900.',
            'year.max'            => 'El año no puede ser mayor a 2100.',
            'year.unique'         => 'Ese año académico ya existe.',
            'start_date.required' => 'La fecha de inicio es requerida.',
            'start_date.date'     => 'La fecha de inicio no es válida.',
            'end_date.required'   => 'La fecha de fin es requerida.',
            'end_date.date'       => 'La fecha de fin no es válida.',
            'end_date.after'      => 'La fecha de fin debe ser posterior a la de inicio.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');

            if (!$startDate || !$endDate) {
                return;
            }

            $overlapExists = AcademicYear::query()
                ->whereDate('start_date', '<=', $endDate)
                ->whereDate('end_date', '>=', $startDate)
                ->exists();

            if ($overlapExists) {
                $validator->errors()->add('start_date', 'Las fechas se superponen con otro año académico.');
            }
        });
    }
}
