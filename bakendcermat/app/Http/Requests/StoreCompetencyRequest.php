<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompetencyRequest extends FormRequest
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
        return [
            'course_id'    => ['required', 'uuid', 'exists:courses,id'],
            'description'  => ['required', 'string', 'max:2000'],
            'code'         => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('competencies', 'code')->where(
                    fn ($query) => $query->where('course_id', $this->input('course_id'))
                ),
            ],
            'order_index'  => ['nullable', 'integer', 'min:1'],
            'order'        => ['nullable', 'integer', 'min:1'],
            'name'         => ['nullable', 'string', 'max:255'],
        ];
    }
}
