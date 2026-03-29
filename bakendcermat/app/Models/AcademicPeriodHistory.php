<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicPeriodHistory extends Model
{
    use HasUuids;

    protected $table = 'academic_period_histories';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'period_id',
        'academic_year_id',
        'generated_by',
        'generated_at',
        'is_finalized',
        'students_count',
        'evaluations_count',
        'attendance_count',
        'assignments_count',
        'task_submissions_count',
        'assignment_submissions_count',
        'messages_count',
        'summary',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
        'is_finalized' => 'boolean',
        'students_count' => 'integer',
        'evaluations_count' => 'integer',
        'attendance_count' => 'integer',
        'assignments_count' => 'integer',
        'task_submissions_count' => 'integer',
        'assignment_submissions_count' => 'integer',
        'messages_count' => 'integer',
        'summary' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class, 'period_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function studentSnapshots(): HasMany
    {
        return $this->hasMany(AcademicPeriodStudentSnapshot::class, 'academic_period_history_id');
    }
}
