<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Assignment extends Model
{
    use HasUuids;

    protected $table = 'assignments';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'course_id',
        'section_id',
        'title',
        'description',
        'instructions',
        'due_date',
        'max_score',
        'attachment_url',
    ];

    public function submissions(): HasMany
    {
        return $this->hasMany(TaskSubmission::class , 'assignment_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class , 'course_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class , 'section_id');
    }

}
