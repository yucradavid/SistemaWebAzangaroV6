<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecoveryResult extends Model
{
    use HasUuids;

    protected $table = 'recovery_results';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'recovery_process_id',
        'competency_id',
        'course_id',
        'initial_level',
        'recovery_level',
        'final_level',
        'is_resolved',
        'observations',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function recoveryProcess(): BelongsTo
    {
        return $this->belongsTo(RecoveryProcess::class, 'recovery_process_id');
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
}
