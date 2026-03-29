<?php

namespace App\Models;

use App\Models\FinancialPlan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanInstallment extends Model
{
    use HasUuids;

    protected $table = 'plan_installments';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'plan_id',
        'installment_number',
        'due_date',
        'amount',
        'description',
        'created_at',
    ];

    protected $casts = [
        'installment_number' => 'integer',
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(FinancialPlan::class, 'plan_id');
    }
}
