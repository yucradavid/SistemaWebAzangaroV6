<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Course extends Model
{
    use HasUuids;

    protected $table = 'courses';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'code',
        'name',
        'description',
        'grade_level_id',
        'hours_per_week',
        'color',
        'created_at'
    ];

    protected $casts = [
        'hours_per_week' => 'integer',
        'created_at' => 'datetime'
    ];

    protected $appends = [
        'weekly_hours',
    ];

    public function getWeeklyHoursAttribute(): ?int
    {
        return $this->hours_per_week;
    }

    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class);
    }
}
