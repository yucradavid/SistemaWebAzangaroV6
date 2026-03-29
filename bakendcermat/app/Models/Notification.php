<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'notifications';
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',       // receptor (users.id)
        'type',          // notification_type
        'status',        // notification_status
        'title',         // opcional
        'message',       // opcional
        'data',          // opcional (json)
        'link',          // opcional
        'created_by',    // opcional
        'related_entity_type',
        'related_entity_id',
        'read_at',       // opcional
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
