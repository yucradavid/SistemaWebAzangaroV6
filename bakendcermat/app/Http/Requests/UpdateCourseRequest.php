<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'hours_per_week' => $this->input('hours_per_week') ?? $this->input('weekly_hours'),
        ]);
    }

    public function rules(): array
    {
        $id = $this->route('course')->id ?? null;

        return [
            'code' => ['string', Rule::unique('courses','code')->ignore($id)],
            'name' => ['string'],
            'description' => ['nullable','string'],
            'grade_level_id' => ['uuid','exists:grade_levels,id'],
            'hours_per_week' => ['integer','min:1'],
            'weekly_hours' => ['nullable','integer','min:1'],
            'color' => ['regex:/^#[0-9A-Fa-f]{6}$/']
        ];
    }
}
