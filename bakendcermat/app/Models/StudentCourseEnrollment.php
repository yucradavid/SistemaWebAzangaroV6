<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentCourseEnrollment extends Model
{
    use HasUuids;

    protected $table = 'student_course_enrollments';

    protected $fillable = [
        'student_id','course_id','section_id','academic_year_id','enrollment_date','status'
    ];

    protected $casts = [
        'enrollment_date' => 'datetime',
    ];

    public function student() { return $this->belongsTo(Student::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function section() { return $this->belongsTo(Section::class); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
}
