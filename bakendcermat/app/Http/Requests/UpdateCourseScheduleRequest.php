<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],
            'section_id'       => ['sometimes', 'uuid', 'exists:sections,id'],
            'course_id'        => ['sometimes', 'uuid', 'exists:courses,id'],
            'teacher_id'       => ['sometimes', 'nullable', 'uuid', 'exists:teachers,id'],

            'day_of_week'      => ['sometimes', 'integer', 'min:1', 'max:7'],

            // Si envías una, obligas la otra
            'start_time'       => ['sometimes', 'date_format:H:i', 'required_with:end_time'],
            'end_time'         => ['sometimes', 'date_format:H:i', 'required_with:start_time', 'after:start_time'],

            'room_number'      => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'La hora fin debe ser mayor que la hora inicio.',
        ];
    }
}
