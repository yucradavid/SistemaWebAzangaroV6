<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentGuardian extends Model
{
    use HasUuids;

    protected $table = 'student_guardians';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // solo created_at

    protected $fillable = [
        'student_id',
        'guardian_id',
        'is_primary',
        'created_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }
}
