<?php

namespace App\Models;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashClosure extends Model
{
    use HasUuids;

    protected $table = 'cash_closures';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'closure_date',
        'opening_balance',
        'cash_received',
        'expected_balance',
        'actual_balance',
        'difference',
        'notes',
        'closed_by',
        'created_at',
        'cashier_id',
        'opening_time',
        'closing_time',
        'total_cash',
        'total_cards',
        'total_transfers',
        'total_yape',
        'total_plin',
        'total_amount',
        'payments_count',
    ];

    protected $casts = [
        'closure_date' => 'date',
        'opening_time' => 'datetime',
        'closing_time' => 'datetime',
        'opening_balance' => 'decimal:2',
        'cash_received' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'actual_balance' => 'decimal:2',
        'difference' => 'decimal:2',
        'total_cash' => 'decimal:2',
        'total_cards' => 'decimal:2',
        'total_transfers' => 'decimal:2',
        'total_yape' => 'decimal:2',
        'total_plin' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'payments_count' => 'integer',
        'created_at' => 'datetime',
    ];

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'cashier_id');
    }
}
