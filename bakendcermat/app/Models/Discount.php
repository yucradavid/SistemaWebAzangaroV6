<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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
        'academic_year_id',
        'auto_apply_on',
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

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function studentDiscounts(): HasMany
    {
        return $this->hasMany(StudentDiscount::class, 'discount_id');
    }

    /**
     * Lista EXPLICITA de conceptos afectados. Solo para lectura: para escribir
     * usar syncFeeConcepts(), porque attach()/sync() no generan el uuid del
     * pivote (ver DiscountFeeConcept).
     */
    public function feeConcepts(): BelongsToMany
    {
        return $this->belongsToMany(FeeConcept::class, 'discount_fee_concepts', 'discount_id', 'fee_concept_id')
            ->withPivot('created_at');
    }

    /**
     * UNICO lugar donde se decide si un descuento afecta a un cargo.
     *
     * Antes esta regla estaba escrita dos veces (StudentDiscountController y
     * StudentFinancialAccountService) y por eso podia divergir. Vive aqui para
     * que exista una sola definicion.
     *
     * Precedencia:
     *   1. Si el descuento tiene lista explicita de conceptos, MANDA esa lista
     *      y el scope se ignora. Es lo que evita que un concepto futuro
     *      (talleres, uniformes) quede afectado sin querer.
     *   2. Si no tiene ninguno, se resuelve por scope exactamente como siempre,
     *      para no cambiarle el comportamiento a los descuentos ya creados
     *      (hermanos, beca).
     */
    public function appliesTo(?string $chargeType, ?string $chargeConceptId): bool
    {
        $explicitConceptIds = $this->relationLoaded('feeConcepts')
            ? $this->feeConcepts->pluck('id')->all()
            : $this->feeConcepts()->pluck('fee_concepts.id')->all();

        if (! empty($explicitConceptIds)) {
            return $chargeConceptId !== null && in_array($chargeConceptId, $explicitConceptIds, true);
        }

        return match ($this->scope) {
            'todos' => true,
            'pension', 'matricula' => $this->scope === $chargeType,
            'especifico' => $this->specific_concept_id === $chargeConceptId,
            default => false,
        };
    }

    /**
     * Reemplaza la lista de conceptos afectados. Borra e inserta en vez de
     * hacer un diff: la lista es de unos pocos elementos y asi el resultado es
     * trivial de razonar. Una lista vacia deja el descuento resolviendose por
     * scope, que es el comportamiento heredado.
     *
     * @param  list<string>  $feeConceptIds
     */
    public function syncFeeConcepts(array $feeConceptIds): void
    {
        $ids = array_values(array_unique(array_filter($feeConceptIds)));

        DB::transaction(function () use ($ids) {
            DiscountFeeConcept::query()->where('discount_id', $this->getKey())->delete();

            foreach ($ids as $feeConceptId) {
                DiscountFeeConcept::create([
                    'discount_id' => $this->getKey(),
                    'fee_concept_id' => $feeConceptId,
                    'created_at' => now(),
                ]);
            }
        });

        $this->unsetRelation('feeConcepts');
    }

    /**
     * El descuento que el flujo de aprobacion de matricula debe aplicar solo
     * cuando se elige pago al contado, para ese anio academico. El indice
     * unico parcial discounts_unique_active_auto_apply garantiza que hay como
     * maximo uno activo por anio.
     */
    public static function autoApplyForYear(string $academicYearId, string $mode = 'contado'): ?self
    {
        return static::query()
            ->with('feeConcepts')
            ->where('academic_year_id', $academicYearId)
            ->where('auto_apply_on', $mode)
            ->where('is_active', true)
            ->first();
    }
}
