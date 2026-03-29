<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TeacherCourseAssignment extends Model
{
    use HasUuids;

    protected $table = 'teacher_course_assignments';

    protected $fillable = [
        'teacher_id','section_id','course_id','academic_year_id',
        'assigned_by','assigned_at','is_active','notes'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function section() { return $this->belongsTo(Section::class); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
    public function assignedByProfile() { return $this->belongsTo(Profile::class, 'assigned_by'); }
}
