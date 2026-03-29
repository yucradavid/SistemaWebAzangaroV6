<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EnrollmentApplication extends Model
{
    use HasUuids;

    protected $table = 'enrollment_applications';

    protected $fillable = [
        'student_first_name','student_last_name','student_document_type','student_document_number',
        'student_birth_date','student_gender','student_address','student_photo_url',
        'guardian_first_name','guardian_last_name','guardian_document_type','guardian_document_number',
        'guardian_phone','guardian_email','guardian_address','guardian_relationship',
        'grade_level_id','previous_school','has_special_needs','special_needs_description',
        'emergency_contact_name','emergency_contact_phone',
        'notes','status','application_date','reviewed_at','reviewed_by','rejection_reason','admin_notes',
        'academic_year_id',
    ];

    protected $casts = [
        'student_birth_date' => 'date',
        'has_special_needs' => 'boolean',
        'application_date' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function gradeLevel() { return $this->belongsTo(GradeLevel::class); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
    public function reviewedByProfile() { return $this->belongsTo(Profile::class, 'reviewed_by'); }
}
