<?php

namespace App\Models;

use App\Models\AcademicYear;
use App\Models\FeeConcept;
use App\Models\PlanInstallment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialPlan extends Model
{
    use HasUuids;

    protected $table = 'financial_plans';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;
    protected $appends = [
        'installments_count',
        'total_amount',
    ];

    protected $fillable = [
        'name',
        'academic_year_id',
        'concept_id',
        'number_of_installments',
        'description',
        'is_active',
    ];

    protected $casts = [
        'number_of_installments' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function concept(): BelongsTo
    {
        return $this->belongsTo(FeeConcept::class, 'concept_id');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(PlanInstallment::class, 'plan_id')->orderBy('installment_number');
    }

    public function getInstallmentsCountAttribute(): int
    {
        if ($this->relationLoaded('installments')) {
            return $this->installments->count();
        }

        return (int) ($this->number_of_installments ?? 0);
    }

    public function getTotalAmountAttribute(): float
    {
        if ($this->relationLoaded('installments')) {
            return round((float) $this->installments->sum('amount'), 2);
        }

        return round((float) $this->installments()->sum('amount'), 2);
    }
}
