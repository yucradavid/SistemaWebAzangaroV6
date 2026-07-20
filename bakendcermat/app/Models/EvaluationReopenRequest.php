<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationReopenRequest extends Model
{
    use HasUuids;

    protected $table = 'evaluation_reopen_requests';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'evaluation_id',
        'teacher_id',
        'requested_by',   // public.users.id (docente solicitante)
        'reason',
        'status',         // pendiente | aprobada | rechazada
        'approved_by',    // public.users.id (admin/director/coordinator)
        'approved_at',
        'expires_at',
        'rejection_reason',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class, 'evaluation_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Aprobada y dentro de la ventana de edicion (24h desde la aprobacion)
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'aprobada')->where('expires_at', '>', now());
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pendiente');
    }

    public static function hasActiveForEvaluation(string $evaluationId): bool
    {
        return static::query()
            ->where('evaluation_id', $evaluationId)
            ->active()
            ->exists();
    }
}
