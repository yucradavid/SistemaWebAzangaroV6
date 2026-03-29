<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicPeriodStudentSnapshot extends Model
{
    use HasUuids;

    protected $table = 'academic_period_student_snapshots';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'academic_period_history_id',
        'student_id',
        'section_id',
        'student_code',
        'student_name',
        'snapshot',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function history(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriodHistory::class, 'academic_period_history_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }
}
