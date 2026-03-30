<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceDailyRecord extends Model
{
    use HasUuids;

    protected $table = 'attendance_daily_records';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'student_id',
        'section_id',
        'academic_year_id',
        'date',
        'entry_status',
        'entry_note',
        'entry_marked_at',
        'entry_source',
        'exit_status',
        'exit_note',
        'exit_marked_at',
        'exit_source',
        'last_recorded_by_profile_id',
    ];

    protected $casts = [
        'date' => 'date',
        'entry_marked_at' => 'datetime',
        'exit_marked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function recorderProfile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'last_recorded_by_profile_id');
    }
}
