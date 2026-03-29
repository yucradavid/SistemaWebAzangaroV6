<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'education_level' => ['sometimes', 'string', Rule::in(['inicial', 'primaria', 'secundaria'])],
            'cycle_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'grade_number' => ['sometimes', 'nullable', 'integer', 'between:1,6'],
            'rule_name' => ['sometimes', 'string', 'max:120'],
            'promotion_mode' => ['sometimes', 'string', Rule::in([
                'direct_promotion',
                'minimum_b_half_all_competencies',
                'aad_half_in_n_areas_rest_b',
            ])],
            'promotion_area_count' => ['sometimes', 'nullable', 'integer', 'between:1,20'],
            'min_expected_level' => ['sometimes', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'minimum_level_for_remaining_competencies' => ['sometimes', 'nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'max_b_competencies' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_c_competencies' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'permanence_mode' => ['sometimes', 'string', Rule::in(['none', 'c_more_than_half_in_n_areas'])],
            'permanence_area_count' => ['sometimes', 'nullable', 'integer', 'between:1,20'],
            'requires_recovery_for_c' => ['sometimes', 'boolean'],
            'allows_guided_promotion' => ['sometimes', 'boolean'],
            'active' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
