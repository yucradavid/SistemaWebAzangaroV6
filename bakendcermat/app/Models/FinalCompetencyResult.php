<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinalCompetencyResult extends Model
{
    use HasUuids;

    protected $table = 'final_competency_results';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'student_id',
        'course_id',
        'competency_id',
        'academic_year_id',
        'source_period_id',
        'final_level',
        'current_status',
        'requires_support',
        'has_consecutive_c',
        'evidence_note',
    ];

    protected $casts = [
        'requires_support' => 'boolean',
        'has_consecutive_c' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function sourcePeriod(): BelongsTo
    {
        return $this->belongsTo(Period::class, 'source_period_id');
    }
}
