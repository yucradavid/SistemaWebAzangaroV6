<?php

namespace App\Http\Requests\TeacherCourseAssignments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeacherCourseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacherId = $this->input('teacher_id');
        $sectionId = $this->input('section_id');
        $courseId  = $this->input('course_id');
        $yearId    = $this->input('academic_year_id');

        return [
            'teacher_id' => ['required', 'uuid', 'exists:teachers,id'],
            'section_id' => ['required', 'uuid', 'exists:sections,id'],
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],

            'assigned_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],

            'unique_combo' => [
                Rule::unique('teacher_course_assignments')
                    ->where(fn ($q) => $q
                        ->where('teacher_id', $teacherId)
                        ->where('section_id', $sectionId)
                        ->where('course_id', $courseId)
                        ->where('academic_year_id', $yearId)
                    ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'unique_combo.unique' => 'Ya existe una asignación para ese docente/curso/sección/año académico.',
        ];
    }
}
