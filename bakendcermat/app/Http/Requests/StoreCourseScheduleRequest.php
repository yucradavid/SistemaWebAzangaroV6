<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'section_id'       => ['required', 'uuid', 'exists:sections,id'],
            'course_id'        => ['required', 'uuid', 'exists:courses,id'],
            'teacher_id'       => ['nullable', 'uuid', 'exists:teachers,id'],

            'day_of_week'      => ['required', 'integer', 'min:1', 'max:7'],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],

            'room_number'      => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'day_of_week.min' => 'El día debe estar entre 1 y 7 (1=Lunes ... 7=Domingo).',
            'day_of_week.max' => 'El día debe estar entre 1 y 7 (1=Lunes ... 7=Domingo).',
            'end_time.after'  => 'La hora fin debe ser mayor que la hora inicio.',
        ];
    }
}
