<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashOpeningBalance extends Model
{
    use HasUuids;

    protected $table = 'cash_opening_balances';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'closure_date',
        'amount',
        'updated_by',
    ];

    protected $casts = [
        'closure_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
