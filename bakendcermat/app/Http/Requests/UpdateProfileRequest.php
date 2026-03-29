<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('profile');

        return [
            'role' => ['sometimes','string'],
            'full_name' => ['sometimes','string'],
            'dni' => ['nullable','string', Rule::unique('profiles','dni')->ignore($id, 'id')],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'avatar_url' => ['nullable','string'],
            'is_active' => ['sometimes','boolean'],
            'created_by' => ['nullable','uuid'],
        ];
    }
}
