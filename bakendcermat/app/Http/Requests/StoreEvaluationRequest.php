<?php

namespace App\Http\Requests;

use App\Models\Competency;
use App\Models\Period;
use App\Models\StudentCourseEnrollment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'    => ['required', 'uuid', 'exists:students,id'],
            'course_id'     => ['required', 'uuid', 'exists:courses,id'],
            'competency_id' => ['required', 'uuid', 'exists:competencies,id'],
            'period_id'     => ['required', 'uuid', 'exists:periods,id'],

            'grade'  => ['required', 'string', Rule::in(['AD','A','B','C'])],
            'status' => ['required', 'string', Rule::in(['borrador','publicada','cerrada'])],

            'comments' => ['nullable', 'string', 'max:2000'],
            'observations' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $courseId = (string) $this->input('course_id');
            $competencyId = (string) $this->input('competency_id');
            $studentId = (string) $this->input('student_id');
            $periodId = (string) $this->input('period_id');

            $competency = Competency::query()->find($competencyId);
            $period = Period::query()->find($periodId);

            if ($competency && $competency->course_id !== $courseId) {
                $validator->errors()->add(
                    'competency_id',
                    'La competencia seleccionada no pertenece al curso indicado.'
                );
            }

            if ($period) {
                $isEnrolled = StudentCourseEnrollment::query()
                    ->where('student_id', $studentId)
                    ->where('course_id', $courseId)
                    ->where('academic_year_id', $period->academic_year_id)
                    ->where('status', 'active')
                    ->exists();

                if (!$isEnrolled) {
                    $validator->errors()->add(
                        'student_id',
                        'El estudiante no tiene matrícula activa en ese curso para el año académico del periodo.'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'grade.in'  => 'La nota debe ser AD, A, B o C.',
            'status.in' => 'El estado debe ser borrador, publicada o cerrada.',
        ];
    }
}
