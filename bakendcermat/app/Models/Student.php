<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Student extends Model
{
    use HasUuids;

    protected $table = 'students';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'student_code',
        'first_name',
        'last_name',
        'dni',
        'birth_date',
        'gender',
        'address',
        'section_id',
        'enrollment_date',
        'status',
        'photo_url',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'enrollment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'full_name',
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function guardians()
    {
        return $this->belongsToMany(Guardian::class, 'student_guardians')
            ->withPivot(['id', 'is_primary', 'created_at']);
    }

    public function studentDiscounts()
{
    return $this->hasMany(StudentDiscount::class, 'student_id');
}

    public function charges()
    {
        return $this->hasMany(Charge::class, 'student_id');
    }

public function messages()
{
    return $this->hasMany(Message::class, 'student_id');
}

    public function enrollments()
    {
        return $this->hasMany(StudentCourseEnrollment::class);
    }

public function assignmentSubmissions()
{
    return $this->hasMany(AssignmentSubmission::class, 'student_id');
}

    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }
}
