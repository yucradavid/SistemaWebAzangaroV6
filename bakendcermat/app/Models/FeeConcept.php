<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FeeConcept extends Model
{
    use HasUuids;

    protected $table = 'fee_concepts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
        'base_amount',
        'type',         // concept_type
        'periodicity',  // concept_periodicity
        'is_active',
    ];

    public function charges(): HasMany
    {
        return $this->hasMany(Charge::class, 'concept_id');
    }
    public function discounts()
{
    return $this->hasMany(Discount::class, 'specific_concept_id');
}

public function financialPlans()
{
    return $this->hasMany(FinancialPlan::class, 'concept_id');
}
}
