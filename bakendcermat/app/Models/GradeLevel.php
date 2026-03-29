<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class GradeLevel extends Model
{
    use HasUuids;

    protected $table = 'grade_levels';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'level',
        'grade',
        'name',
        'created_at'
    ];

    protected $casts = [
        'grade' => 'integer',
        'created_at' => 'datetime'
    ];

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}
