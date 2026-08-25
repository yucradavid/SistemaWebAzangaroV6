<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Distingue un mensaje normal (docente<->apoderado, comportamiento actual
 * sin cambios) de uno de Tutoria Academica (crea message_recipients para
 * estudiante + apoderado y notifica con type tutoria_registrada).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('category', 20)->default('general');
        });

        DB::statement(
            "ALTER TABLE messages ADD CONSTRAINT messages_category_check "
            ."CHECK (category IN ('general', 'tutoria'))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_category_check');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
