<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payment extends Model
{
    use HasUuids;

    protected $table = 'payments';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'charge_id',
        'student_id',
        'amount',
        'method', // payment_method
        'payment_method',
        'reference',
        'transaction_ref',
        'paid_at',
        'payment_date',
        'received_by',
        'notes',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    protected $appends = [
        'method',
        'reference',
        'paid_at',
    ];

    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class , 'charge_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class , 'student_id');
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class , 'payment_id');
    }

    public function getMethodAttribute($value): ?string
    {
        return $value ?? $this->attributes['payment_method'] ?? null;
    }

    public function getReferenceAttribute($value): ?string
    {
        return $value ?? $this->attributes['transaction_ref'] ?? null;
    }

    public function getPaidAtAttribute($value): ?Carbon
    {
        $raw = $value ?? $this->attributes['payment_date'] ?? null;

        return $raw ? Carbon::parse($raw) : null;
    }
}
