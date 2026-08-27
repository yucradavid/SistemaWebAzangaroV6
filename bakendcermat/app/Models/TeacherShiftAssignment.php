<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TeacherShiftAssignment extends Model
{
    use HasUuids;

    protected $table = 'teacher_shift_assignments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'teacher_id',
        'shift',
        'academic_year_id',
        'assigned_by',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
