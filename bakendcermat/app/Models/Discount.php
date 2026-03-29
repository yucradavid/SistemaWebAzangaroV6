<?php

namespace App\Models;

use App\Models\FeeConcept;
use App\Models\StudentDiscount;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discount extends Model
{
    use HasUuids;

    protected $table = 'discounts';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'type',
        'value',
        'scope',
        'specific_concept_id',
        'description',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function concept(): BelongsTo
    {
        return $this->belongsTo(FeeConcept::class, 'specific_concept_id');
    }

    public function studentDiscounts(): HasMany
    {
        return $this->hasMany(StudentDiscount::class, 'discount_id');
    }
}
