<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AttendanceScheduleConfig extends Model
{
    use HasUuids;

    protected $table = 'attendance_schedule_config';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'shift',
        'checkpoint_type',
        'window_start',
        'late_after',
        'window_end',
        'is_active',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
