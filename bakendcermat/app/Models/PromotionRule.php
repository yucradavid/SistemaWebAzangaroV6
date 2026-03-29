<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PromotionRule extends Model
{
    use HasUuids;

    protected $table = 'promotion_rules';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'education_level',
        'cycle_code',
        'grade_number',
        'rule_name',
        'promotion_mode',
        'promotion_area_count',
        'min_expected_level',
        'minimum_level_for_remaining_competencies',
        'max_b_competencies',
        'max_c_competencies',
        'permanence_mode',
        'permanence_area_count',
        'requires_recovery_for_c',
        'allows_guided_promotion',
        'active',
        'notes',
    ];

    protected $casts = [
        'grade_number' => 'integer',
        'promotion_area_count' => 'integer',
        'max_b_competencies' => 'integer',
        'max_c_competencies' => 'integer',
        'permanence_area_count' => 'integer',
        'requires_recovery_for_c' => 'boolean',
        'allows_guided_promotion' => 'boolean',
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
