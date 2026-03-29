<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('student');

        return [
            'user_id' => ['nullable','uuid'],
            'student_code' => ['sometimes','string', Rule::unique('students','student_code')->ignore($id)],
            'first_name' => ['sometimes','string'],
            'last_name' => ['sometimes','string'],
            'dni' => ['nullable','string', Rule::unique('students','dni')->ignore($id)],
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
