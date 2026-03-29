<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'id' => ['required','uuid'], // FK a auth.users(id)
            'role' => ['required','string'],
            'full_name' => ['required','string'],
            'dni' => ['nullable','string','unique:profiles,dni'],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'avatar_url' => ['nullable','string'],
            'is_active' => ['boolean'],
            'created_by' => ['nullable','uuid'], // FK a auth.users(id)
        ];
    }
}
