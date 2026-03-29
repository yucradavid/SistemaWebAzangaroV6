<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGuardianRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('guardian');

        return [
            'user_id' => ['nullable','uuid', Rule::unique('guardians','user_id')->ignore($id)],
            'first_name' => ['sometimes','string'],
            'last_name' => ['sometimes','string'],
            'dni' => ['nullable','string', Rule::unique('guardians','dni')->ignore($id)],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'address' => ['nullable','string'],
            'relationship' => ['nullable','string'],
            'is_primary' => ['boolean'],
        ];
    }
}
