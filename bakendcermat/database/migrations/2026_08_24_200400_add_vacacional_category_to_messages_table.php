<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reutiliza el mismo patron de Tutoria Academica (messages + message_recipients)
 * para el aviso automatico de Escuela Vacacional, agregando 'vacacional' como
 * tercera categoria valida junto a 'general' y 'tutoria'.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_category_check');
        DB::statement(
            "ALTER TABLE messages ADD CONSTRAINT messages_category_check "
            ."CHECK (category IN ('general', 'tutoria', 'vacacional'))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_category_check');
        DB::statement(
            "ALTER TABLE messages ADD CONSTRAINT messages_category_check "
            ."CHECK (category IN ('general', 'tutoria'))"
        );
    }
};
