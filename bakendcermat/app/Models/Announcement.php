<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Announcement extends Model
{
    use HasUuids;

    protected $table = 'announcements';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'content',
        'audience',
        'status',
        'section_id',
        'created_by',
        'approved_by',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'approved_by');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }
}
