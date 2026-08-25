<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('charges')) {
            return;
        }

        // El guard PHP (ChargeController::batchStore) tambien distingue por
        // notes/description (plan + numero de cuota), asi que el indice debe
        // incluir esa columna o rechazaria como duplicados cargos legitimos
        // de planes distintos que coincidan en fecha. Se usa md5() en vez de
        // la columna cruda porque es TEXT sin limite (hasta 2000 caracteres
        // via validacion de store()/update()), y un valor largo podria exceder
        // el tamano maximo de entrada de un indice btree de Postgres (~2704 bytes).
        $notesColumn = Schema::hasColumn('charges', 'notes')
            ? 'notes'
            : (Schema::hasColumn('charges', 'description') ? 'description' : null);

        $notesExpr = $notesColumn ? "md5(coalesce({$notesColumn}, ''))" : "''";

        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS charges_unique_active_charge
            ON charges (student_id, academic_year_id, concept_id, due_date, {$notesExpr})
            WHERE voided_at IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS charges_unique_active_charge');
    }
};
