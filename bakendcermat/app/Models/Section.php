<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasUuids;

    protected $table = 'sections';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'academic_year_id',
        'grade_level_id',
        'section_letter',
        'capacity',
        'created_at',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
    ];

    protected $appends = [
        'name',
    ];

    public function getNameAttribute(): ?string
    {
        return $this->section_letter;
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'section_id');
    }

    public function studentCourseEnrollments()
    {
        return $this->hasMany(StudentCourseEnrollment::class, 'section_id');
    }

    public function teacherCourseAssignments()
    {
        return $this->hasMany(TeacherCourseAssignment::class, 'section_id');
    }

    public function courseSchedules()
    {
        return $this->hasMany(CourseSchedule::class, 'section_id');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'section_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'section_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'section_id');
    }
}
