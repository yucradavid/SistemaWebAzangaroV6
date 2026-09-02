<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Modalidad de pago elegida al aprobar la matricula, guardada en la propia
 * solicitud (que es donde se toma la decision y donde ya vive academic_year_id):
 *
 *  - payment_mode: 'contado' | 'cuotas'. Nullable porque las solicitudes ya
 *    aprobadas antes de esta funcionalidad no tienen modalidad, y porque una
 *    solicitud pending todavia no eligio ninguna.
 *
 *  - installments_count: cantidad de cuotas elegida. Solo tiene sentido con
 *    payment_mode='cuotas'; en contado debe quedar NULL. El piso es 2 (una
 *    "cuota" unica es, por definicion, pago al contado). El techo NO se fija
 *    aqui: la lista de opciones (3/4/5/8) es configurable por el admin en
 *    system_settings y se valida en el request, no en el esquema.
 *
 *  - student_id: el alumno que la funcion SQL approve_enrollment_application
 *    creo a partir de esta solicitud. Hasta ahora ese vinculo solo existia en
 *    el valor de retorno de la funcion y se perdia; sin el, la vista de
 *    "contado aprobado pero no cobrado" tendria que unir por DNI, que es
 *    fragil. PHP lo rellena despues de una aprobacion exitosa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_applications', function (Blueprint $table) {
            $table->string('payment_mode', 10)->nullable();
            $table->integer('installments_count')->nullable();
            $table->uuid('student_id')->nullable();

            $table->foreign('student_id')
                ->references('id')->on('students')
                ->nullOnDelete();

            $table->index('student_id');
            $table->index('payment_mode');
        });

        DB::statement(
            'ALTER TABLE enrollment_applications ADD CONSTRAINT enrollment_applications_payment_mode_check '
            ."CHECK (payment_mode IS NULL OR payment_mode IN ('contado', 'cuotas'))"
        );

        // Coherencia entre modalidad y cantidad de cuotas: contado nunca lleva
        // numero de cuotas, y cuotas siempre lleva uno de al menos 2. Evita
        // que un bug de frontend deje una matricula en un estado imposible de
        // interpretar despues.
        //
        // El "IS NOT NULL" explicito NO es redundante: en Postgres un CHECK
        // solo rechaza cuando evalua a FALSE, no cuando evalua a NULL. Sin el,
        // payment_mode='cuotas' con installments_count NULL daria
        // TRUE AND NULL = NULL y la fila pasaria igual.
        DB::statement(
            'ALTER TABLE enrollment_applications ADD CONSTRAINT enrollment_applications_installments_coherence_check '
            .'CHECK ('
            .'  (payment_mode IS NULL     AND installments_count IS NULL)'
            ." OR (payment_mode = 'contado' AND installments_count IS NULL)"
            ." OR (payment_mode = 'cuotas'  AND installments_count IS NOT NULL AND installments_count >= 2)"
            .')'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE enrollment_applications DROP CONSTRAINT IF EXISTS enrollment_applications_installments_coherence_check');
        DB::statement('ALTER TABLE enrollment_applications DROP CONSTRAINT IF EXISTS enrollment_applications_payment_mode_check');

        Schema::table('enrollment_applications', function (Blueprint $table) {
            $table->dropIndex(['payment_mode']);
            $table->dropIndex(['student_id']);
            $table->dropForeign(['student_id']);
            $table->dropColumn(['payment_mode', 'installments_count', 'student_id']);
        });
    }
};
