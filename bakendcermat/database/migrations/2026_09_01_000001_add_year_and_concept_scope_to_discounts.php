<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Extiende el sistema de descuentos ya existente (Catalogo Financiero ->
 * Descuentos) para soportar el descuento por pago al contado, SIN reemplazar
 * ni tocar el mecanismo manual actual (hermanos/beca):
 *
 *  - academic_year_id: nullable. NULL = descuento generico de siempre, que es
 *    como quedan los descuentos ya creados (el de hermanos sigue funcionando
 *    exactamente igual). Con valor = descuento atado a un anio academico, de
 *    modo que el porcentaje puede cambiar cada anio sin afectar los registros
 *    de anios ya cerrados.
 *
 *  - auto_apply_on: nullable. NULL = descuento que el admin asigna a mano por
 *    estudiante (comportamiento actual, sin cambios). 'contado' = descuento
 *    que el flujo de aprobacion de matricula aplica automaticamente cuando se
 *    elige esa modalidad de pago.
 *
 *  - discount_fee_concepts: lista EXPLICITA de conceptos afectados. Si el
 *    descuento tiene filas aqui, mandan estas y se ignora el enum scope; si no
 *    tiene ninguna, el descuento se sigue resolviendo por scope exactamente
 *    como hoy. Asi ningun concepto futuro (talleres, uniformes) queda afectado
 *    sin querer, y ningun descuento existente cambia de comportamiento.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discounts', function (Blueprint $table) {
            $table->uuid('academic_year_id')->nullable();
            $table->string('auto_apply_on', 20)->nullable();

            $table->foreign('academic_year_id')
                ->references('id')->on('academic_years')
                ->nullOnDelete();

            $table->index(['academic_year_id', 'auto_apply_on'], 'idx_discounts_year_auto_apply');
        });

        // Solo 'contado' por ahora; cualquier modalidad automatica futura debe
        // agregarse aqui de forma explicita, no por texto libre.
        DB::statement(
            'ALTER TABLE discounts ADD CONSTRAINT discounts_auto_apply_on_check '
            ."CHECK (auto_apply_on IS NULL OR auto_apply_on IN ('contado'))"
        );

        // Un descuento automatico SIEMPRE debe estar atado a un anio: es lo que
        // permite cambiar el porcentaje de un anio a otro sin reescribir el
        // historico de los anios ya cerrados.
        DB::statement(
            'ALTER TABLE discounts ADD CONSTRAINT discounts_auto_apply_requires_year_check '
            .'CHECK (auto_apply_on IS NULL OR academic_year_id IS NOT NULL)'
        );

        // El flujo de aprobacion busca "el" descuento de contado del anio
        // activo: no puede haber dos activos compitiendo para el mismo anio.
        DB::statement(
            'CREATE UNIQUE INDEX discounts_unique_active_auto_apply '
            .'ON discounts (academic_year_id, auto_apply_on) '
            .'WHERE auto_apply_on IS NOT NULL AND is_active = true'
        );

        Schema::create('discount_fee_concepts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('discount_id');
            $table->uuid('fee_concept_id');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('discount_id')->references('id')->on('discounts')->cascadeOnDelete();
            $table->foreign('fee_concept_id')->references('id')->on('fee_concepts')->cascadeOnDelete();

            $table->unique(['discount_id', 'fee_concept_id']);
            $table->index('fee_concept_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_fee_concepts');

        DB::statement('DROP INDEX IF EXISTS discounts_unique_active_auto_apply');
        DB::statement('ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_auto_apply_requires_year_check');
        DB::statement('ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_auto_apply_on_check');

        Schema::table('discounts', function (Blueprint $table) {
            $table->dropIndex('idx_discounts_year_auto_apply');
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['academic_year_id', 'auto_apply_on']);
        });
    }
};
