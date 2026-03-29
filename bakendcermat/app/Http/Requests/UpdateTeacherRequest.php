<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('teacher');

        return [
            'user_id' => ['nullable','uuid', Rule::unique('teachers','user_id')->ignore($id)],
            'teacher_code' => ['sometimes','string', Rule::unique('teachers','teacher_code')->ignore($id)],
            'first_name' => ['sometimes','string'],
            'last_name' => ['sometimes','string'],
            'dni' => ['nullable','string', Rule::unique('teachers','dni')->ignore($id)],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'specialization' => ['nullable','string'],
            'hire_date' => ['nullable','date'],
            'status' => ['nullable','string'],
            'photo_url' => ['nullable','string'],
        ];
    }
}
