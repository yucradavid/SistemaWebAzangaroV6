<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChargeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id'       => ['required','uuid','exists:students,id'],
            'academic_year_id' => ['required','uuid','exists:academic_years,id'],
            'concept_id'       => ['required','uuid','exists:fee_concepts,id'],

            'type'   => ['required','string', Rule::in(['matricula','pension','material','uniforme','otro'])],
            'status' => ['nullable','string', Rule::in(['pendiente','pagado_parcial','pagado','vencido'])],

            'amount'           => ['required','numeric','min:0'],
            'discount_amount'  => ['nullable','numeric','min:0'],
            'paid_amount'      => ['nullable','numeric','min:0'],
            'due_date'         => ['nullable','date'],
            'notes'            => ['nullable','string','max:2000'],
        ];
    }
}
