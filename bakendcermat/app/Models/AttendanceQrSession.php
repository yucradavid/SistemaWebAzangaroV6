<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceQrSession extends Model
{
    use HasUuids;

    protected $table = 'attendance_qr_sessions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'section_id',
        'academic_year_id',
        'date',
        'checkpoint_type',
        'session_code',
        'token',
        'status',
        'late_after_minutes',
        'opened_at',
        'expires_at',
        'closed_at',
        'created_by_profile_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'opened_at' => 'datetime',
        'expires_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'qr_payload',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function creatorProfile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'created_by_profile_id');
    }

    public function getQrPayloadAttribute(): string
    {
        return sprintf(
            'CERMAT_ATTENDANCE|session=%s|checkpoint=%s|date=%s',
            (string) $this->session_code,
            (string) $this->checkpoint_type,
            optional($this->date)->toDateString() ?? ''
        );
    }
}
