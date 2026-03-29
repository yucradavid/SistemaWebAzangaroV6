<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AcademicYear extends Model
{
    use HasUuids;

    protected $table = 'academic_years';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'year',
        'start_date',
        'end_date',
        'is_active',
        'created_at'
    ];

    protected $casts = [
        'year' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'created_at' => 'datetime'
    ];

    public function periods()
    {
        return $this->hasMany(Period::class);
    }

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function periodHistories()
    {
        return $this->hasMany(AcademicPeriodHistory::class, 'academic_year_id');
    }

    public function studentDiscounts()
{
    return $this->hasMany(StudentDiscount::class, 'academic_year_id');
}

public function financialPlans()
{
    return $this->hasMany(FinancialPlan::class, 'academic_year_id');
}
}
