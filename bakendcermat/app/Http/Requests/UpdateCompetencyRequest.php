<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompetencyRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->input('description') ?: $this->input('name'),
            'order_index' => $this->input('order_index') ?? $this->input('order'),
        ]);
    }

    public function rules(): array
    {
        $competency = $this->route('competency');
        $competencyId = is_object($competency) ? $competency->id : $competency;
        $courseId = $this->input('course_id') ?: (is_object($competency) ? $competency->course_id : null);

        return [
            'course_id'    => ['sometimes', 'uuid', 'exists:courses,id'],
            'description'  => ['sometimes', 'nullable', 'string', 'max:2000'],
            'code'         => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('competencies', 'code')
                    ->ignore($competencyId)
                    ->where(fn ($query) => $query->where('course_id', $courseId)),
            ],
            'order_index'  => ['sometimes', 'nullable', 'integer', 'min:1'],
            'order'        => ['sometimes', 'nullable', 'integer', 'min:1'],
            'name'         => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
