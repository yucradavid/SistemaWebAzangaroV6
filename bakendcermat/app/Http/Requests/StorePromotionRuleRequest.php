<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromotionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'education_level' => ['required', 'string', Rule::in(['inicial', 'primaria', 'secundaria'])],
            'cycle_code' => ['nullable', 'string', 'max:20'],
            'grade_number' => ['nullable', 'integer', 'between:1,6'],
            'rule_name' => ['required', 'string', 'max:120'],
            'promotion_mode' => ['required', 'string', Rule::in([
                'direct_promotion',
                'minimum_b_half_all_competencies',
                'aad_half_in_n_areas_rest_b',
            ])],
            'promotion_area_count' => ['nullable', 'integer', 'between:1,20'],
            'min_expected_level' => ['required', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'minimum_level_for_remaining_competencies' => ['nullable', 'string', Rule::in(['AD', 'A', 'B', 'C'])],
            'max_b_competencies' => ['nullable', 'integer', 'min:0'],
            'max_c_competencies' => ['nullable', 'integer', 'min:0'],
            'permanence_mode' => ['required', 'string', Rule::in(['none', 'c_more_than_half_in_n_areas'])],
            'permanence_area_count' => ['nullable', 'integer', 'between:1,20'],
            'requires_recovery_for_c' => ['nullable', 'boolean'],
            'allows_guided_promotion' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
