<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeConceptRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required','string','max:255'],
            'description' => ['nullable','string','max:2000'],
            'base_amount' => ['required','numeric','min:0'],

            'type'        => ['required','string', Rule::in(['matricula','pension','interes','certificado','taller','servicio','otro'])],
            'periodicity' => ['required','string', Rule::in(['unico','mensual','anual','opcional'])],

            'is_active'   => ['nullable','boolean'],
        ];
    }
}
