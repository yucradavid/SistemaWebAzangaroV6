<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Receipt extends Model
{
    protected $table = 'receipts';
    const UPDATED_AT = null;

    protected $fillable = [
        'payment_id',
        'student_id',
        'number',
        'receipt_number',
        'issued_at',
        'total',
        'total_amount',
        'notes',
        'issued_by',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    protected $appends = [
        'number',
        'total',
        'issued_at',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function getNumberAttribute($value): ?string
    {
        return $value ?? $this->attributes['receipt_number'] ?? null;
    }

    public function getTotalAttribute($value): float
    {
        if ($value !== null) {
            return (float) $value;
        }

        return (float) ($this->attributes['total_amount'] ?? 0);
    }

    public function getIssuedAtAttribute($value): ?Carbon
    {
        $raw = $value ?? $this->attributes['issued_at'] ?? null;

        return $raw ? Carbon::parse($raw) : null;
    }

    public static function numberColumn(): string
    {
        return Schema::hasColumn('receipts', 'number') ? 'number' : 'receipt_number';
    }

    public static function totalColumn(): string
    {
        return Schema::hasColumn('receipts', 'total') ? 'total' : 'total_amount';
    }

    public static function issuedAtColumn(): string
    {
        return Schema::hasColumn('receipts', 'issued_at') ? 'issued_at' : 'created_at';
    }

    public static function nextNumber(): string
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::select('SELECT pg_advisory_xact_lock(?)', [17032026]);
        }

        $column = self::numberColumn();
        $lastNumber = self::query()
            ->whereNotNull($column)
            ->orderByDesc($column)
            ->value($column);

        preg_match('/(\d+)$/', (string) $lastNumber, $matches);
        $next = isset($matches[1]) ? ((int) $matches[1]) + 1 : 1;

        return 'R-' . str_pad((string) $next, 8, '0', STR_PAD_LEFT);
    }
}
