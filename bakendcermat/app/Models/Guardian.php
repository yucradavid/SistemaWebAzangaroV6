<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Guardian extends Model
{
    use HasUuids;

    protected $table = 'guardians';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'dni',
        'phone',
        'email',
        'address',
        'relationship',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_guardians')
            ->withPivot(['id', 'is_primary', 'created_at']);
    }
}
