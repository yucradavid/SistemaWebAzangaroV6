<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuardianRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable','uuid','unique:guardians,user_id'],
            'first_name' => ['required','string'],
            'last_name' => ['required','string'],
            'dni' => ['nullable','string','unique:guardians,dni'],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'address' => ['nullable','string'],
            'relationship' => ['nullable','string'],
            'is_primary' => ['boolean'],
        ];
    }
}
