<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'       => ['required', 'uuid', 'exists:teachers,id'],
            'course_id'        => ['required', 'uuid', 'exists:courses,id'],
            'section_id'       => ['required', 'uuid', 'exists:sections,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'is_tutor'         => ['nullable', 'boolean'],
        ];
    }
}
