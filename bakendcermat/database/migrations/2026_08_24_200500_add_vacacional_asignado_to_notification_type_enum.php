<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // ALTER TYPE ... ADD VALUE no puede correr dentro de una transaccion en Postgres.
    public $withinTransaction = false;

    public function up(): void
    {
        DB::statement("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'vacacional_asignado'");
    }

    public function down(): void
    {
        // Postgres no permite quitar un valor de enum sin recrear el tipo.
    }
};
