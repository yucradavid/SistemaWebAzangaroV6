<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChargeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => ['sometimes','string', Rule::in(['pendiente','pagado_parcial','pagado','vencido'])],
            'due_date' => ['sometimes','nullable','date'],
            'notes' => ['sometimes','nullable','string','max:2000'],
        ];
    }
}
