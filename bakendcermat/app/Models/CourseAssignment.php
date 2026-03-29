<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CourseAssignment extends Model
{
    use HasUuids;

    protected $table = 'course_assignments';

    const UPDATED_AT = null;

    protected $fillable = [
        'teacher_id','course_id','section_id','academic_year_id','is_tutor'
    ];

    protected $casts = [
        'is_tutor' => 'boolean',
    ];

    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function section() { return $this->belongsTo(Section::class); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
}
