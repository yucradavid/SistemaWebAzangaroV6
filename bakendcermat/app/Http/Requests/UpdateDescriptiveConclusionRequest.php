<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDescriptiveConclusionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'achievement_level' => ['sometimes', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'conclusion_text' => ['sometimes', 'string', 'max:5000'],
            'difficulties' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'recommendations' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'support_actions' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'needs_support' => ['sometimes', 'boolean'],
        ];
    }
}
