<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Period extends Model
{
    use HasUuids;

    protected $table = 'periods';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'academic_year_id',
        'name',
        'period_number',
        'start_date',
        'end_date',
        'is_closed',
        'created_at'
    ];

    protected $casts = [
        'period_number' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_closed' => 'boolean',
        'created_at' => 'datetime'
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function history()
    {
        return $this->hasOne(AcademicPeriodHistory::class, 'period_id');
    }
}
