<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Fila de la lista explicita de conceptos afectados por un descuento.
 *
 * Se modela como Model propio y no se escribe con attach()/sync() de la
 * relacion belongsToMany a proposito: la tabla tiene un id uuid SIN default en
 * base (igual que message_recipients y el resto de tablas creadas por
 * migraciones de Laravel en este proyecto), y attach() inserta por query
 * builder sin generar ese id. HasUuids si lo genera. Para escribir usar
 * Discount::syncFeeConcepts().
 */
class DiscountFeeConcept extends Model
{
    use HasUuids;

    protected $table = 'discount_fee_concepts';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'discount_id',
        'fee_concept_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class, 'discount_id');
    }

    public function feeConcept(): BelongsTo
    {
        return $this->belongsTo(FeeConcept::class, 'fee_concept_id');
    }
}
