<?php

namespace App\Http\Requests\TeacherCourseAssignments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherCourseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assignmentId = $this->route('teacher_course_assignment') ?? $this->route('id');

        $teacherId = $this->input('teacher_id');
        $sectionId = $this->input('section_id');
        $courseId  = $this->input('course_id');
        $yearId    = $this->input('academic_year_id');

        return [
            'teacher_id' => ['sometimes', 'uuid', 'exists:teachers,id'],
            'section_id' => ['sometimes', 'uuid', 'exists:sections,id'],
            'course_id' => ['sometimes', 'uuid', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],

            'assigned_at' => ['sometimes', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string'],

            'unique_combo' => [
                Rule::unique('teacher_course_assignments')
                    ->ignore($assignmentId, 'id')
                    ->where(fn ($q) => $q
                        ->when($teacherId, fn ($qq) => $qq->where('teacher_id', $teacherId))
                        ->when($sectionId, fn ($qq) => $qq->where('section_id', $sectionId))
                        ->when($courseId, fn ($qq) => $qq->where('course_id', $courseId))
                        ->when($yearId, fn ($qq) => $qq->where('academic_year_id', $yearId))
                    ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'unique_combo.unique' => 'Ya existe una asignación con esos valores.',
        ];
    }
}
