<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Competency extends Model
{
    use HasUuids;

    protected $table = 'competencies';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'course_id',
        'description',
        'code',
        'order_index',
        'created_at',
    ];

    protected $appends = [
        'order',
        'name',
    ];

    protected $casts = [
        'order_index' => 'integer',
        'created_at' => 'datetime',
    ];

    public function getOrderAttribute(): ?int
    {
        return $this->order_index;
    }

    public function getNameAttribute(): string
    {
        return (string) $this->description;
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'competency_id');
    }
}
