<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeeConceptRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes','string','max:255'],
            'description' => ['sometimes','nullable','string','max:2000'],
            'base_amount' => ['sometimes','numeric','min:0'],

            'type'        => ['sometimes','string', Rule::in(['matricula','pension','interes','certificado','taller','servicio','otro'])],
            'periodicity' => ['sometimes','string', Rule::in(['unico','mensual','anual','opcional'])],

            'is_active'   => ['sometimes','boolean'],
        ];
    }
}
