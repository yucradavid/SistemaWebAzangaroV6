<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable','uuid'], // FK auth.users
            'student_code' => ['required','string','unique:students,student_code'],
            'first_name' => ['required','string'],
            'last_name' => ['required','string'],
            'dni' => ['nullable','string','unique:students,dni'],
            'birth_date' => ['nullable','date'],
            'gender' => ['nullable','string'],
            'address' => ['nullable','string'],
            'section_id' => ['nullable','uuid','exists:sections,id'],
            'enrollment_date' => ['nullable','date'],
            'status' => ['nullable','string'],
            'photo_url' => ['nullable','string'],
        ];
    }
}
