<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentGuardianRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id' => ['required','uuid','exists:students,id'],
            'guardian_id' => ['required','uuid','exists:guardians,id'],
            'is_primary' => ['boolean'],

            // unique compuesto
            'guardian_id' => [
                'required','uuid','exists:guardians,id',
                Rule::unique('student_guardians')->where(fn($q) =>
                    $q->where('student_id', $this->student_id)
                )
            ],
        ];
    }
}
