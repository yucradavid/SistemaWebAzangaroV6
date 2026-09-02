<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['porcentaje', 'monto_fijo'])],
            'value' => ['required', 'numeric', 'min:0'],
            'scope' => ['nullable', Rule::in(['todos', 'pension', 'matricula', 'especifico'])],
            'specific_concept_id' => ['nullable', 'uuid', 'exists:fee_concepts,id'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],

            // Descuento atado a un anio (permite cambiar el % cada anio sin
            // tocar el historico). Obligatorio si es de aplicacion automatica.
            'academic_year_id' => ['nullable', 'uuid', 'exists:academic_years,id', 'required_with:auto_apply_on'],

            // 'contado' = lo aplica solo el flujo de aprobacion de matricula.
            // null = descuento manual de siempre (hermanos, beca).
            'auto_apply_on' => ['nullable', Rule::in(['contado'])],

            // Lista EXPLICITA de conceptos afectados. Si viene, manda sobre el
            // scope; si no viene, el descuento se resuelve por scope como hoy.
            'fee_concept_ids' => ['nullable', 'array'],
            'fee_concept_ids.*' => ['uuid', 'exists:fee_concepts,id'],
        ];
    }
}
