<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * next_grade_level_id: a que grado queda asignado el estudiante el
 * proximo año academico segun la decision calculada:
 *  - final_status = 'permanece' -> el MISMO grade_level_id actual (repite).
 *  - final_status = 'promociona' o 'vacacional' -> grade_levels.next_grade_level_id
 *    del grado actual (null si egresa, ver is_graduating).
 * is_graduating: true solo cuando el estudiante aprueba (promociona o
 * vacacional) el ULTIMO grado (5to Secundaria, sin next_grade_level_id) —
 * no es un final_status nuevo, es una bandera aparte para no mezclar
 * "aprobo o no aprobo" con "se queda en el colegio o egresa".
 *
 * NOTA sobre 'vacacional' como final_status: es un valor SEPARADO de
 * 'promociona', no se reutiliza ese ultimo — aunque el estudiante SI sube de
 * grado igual, se distingue para que el dashboard y las notificaciones
 * puedan identificar quien tiene cursos pendientes sin cruzar contra
 * vacational_school cada vez.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_final_statuses', function (Blueprint $table) {
            $table->uuid('next_grade_level_id')->nullable();
            $table->boolean('is_graduating')->default(false);
        });

        DB::statement(
            'ALTER TABLE student_final_statuses ADD CONSTRAINT student_final_statuses_next_grade_level_id_fkey '
            .'FOREIGN KEY (next_grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE student_final_statuses DROP CONSTRAINT IF EXISTS student_final_statuses_next_grade_level_id_fkey');

        Schema::table('student_final_statuses', function (Blueprint $table) {
            $table->dropColumn(['next_grade_level_id', 'is_graduating']);
        });
    }
};
