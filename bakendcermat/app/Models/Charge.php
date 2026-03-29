<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Charge extends Model
{
    use HasUuids;

    protected $table = 'charges';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'concept_id',

        'type',       // charge_type
        'status',     // charge_status

        'amount',
        'discount_amount',
        'discount',
        'paid_amount',
        'final_amount',
        'due_date',
        'notes',
        'description',
        'created_by',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'due_date' => 'date',
        'voided_at' => 'datetime',
    ];

    protected $appends = [
        'discount_amount',
        'paid_amount',
        'notes',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function concept(): BelongsTo
    {
        return $this->belongsTo(FeeConcept::class, 'concept_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'charge_id');
    }

    public function getDiscountAmountAttribute($value): float
    {
        if ($value !== null) {
            return (float) $value;
        }

        return (float) ($this->attributes['discount'] ?? 0);
    }

    public function getPaidAmountAttribute($value): float
    {
        if ($value !== null) {
            return (float) $value;
        }

        if ($this->relationLoaded('payments')) {
            return (float) $this->payments
                ->filter(fn ($payment) => empty($payment->voided_at))
                ->sum('amount');
        }

        if (!$this->exists) {
            return 0.0;
        }

        return (float) $this->payments()
            ->whereNull('voided_at')
            ->sum('amount');
    }

    public function getNotesAttribute($value): ?string
    {
        return $value ?? $this->attributes['description'] ?? null;
    }

    public function getStatusAttribute($value): ?string
    {
        if (!empty($this->attributes['voided_at'] ?? null)) {
            return 'anulado';
        }

        return $value;
    }
}
