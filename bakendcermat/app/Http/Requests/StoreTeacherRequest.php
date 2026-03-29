<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable','uuid','unique:teachers,user_id'],
            'teacher_code' => ['required','string','unique:teachers,teacher_code'],
            'first_name' => ['required','string'],
            'last_name' => ['required','string'],
            'dni' => ['nullable','string','unique:teachers,dni'],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'specialization' => ['nullable','string'],
            'hire_date' => ['nullable','date'],
            'status' => ['nullable','string'],
            'photo_url' => ['nullable','string'],
        ];
    }
}
