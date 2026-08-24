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

        DB::statement('
            CREATE UNIQUE INDEX IF NOT EXISTS charges_unique_active_charge
            ON charges (student_id, academic_year_id, concept_id, due_date)
            WHERE voided_at IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS charges_unique_active_charge');
    }
};
