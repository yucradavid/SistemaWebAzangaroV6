<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecoveryProcess extends Model
{
    use HasUuids;

    protected $table = 'recovery_processes';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'grade_level_id',
        'status',
        'referral_reason',
        'support_plan',
        'started_at',
        'ended_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'started_at' => 'date',
        'ended_at' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class, 'grade_level_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(RecoveryResult::class, 'recovery_process_id');
    }
}
