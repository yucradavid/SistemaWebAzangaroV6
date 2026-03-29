<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Teacher extends Model
{
    use HasUuids;

    protected $table = 'teachers';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'teacher_code',
        'first_name',
        'last_name',
        'dni',
        'phone',
        'email',
        'specialization',
        'hire_date',
        'status',
        'photo_url',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
