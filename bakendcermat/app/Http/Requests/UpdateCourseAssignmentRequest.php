<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'       => ['sometimes', 'uuid', 'exists:teachers,id'],
            'course_id'        => ['sometimes', 'uuid', 'exists:courses,id'],
            'section_id'       => ['sometimes', 'uuid', 'exists:sections,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'is_tutor'         => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
