<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * No-op intencional: importar el dump de Supabase (COPY ... FROM stdin,
     * \restrict, etc.) vía DB::unprepared()/PDO no funciona porque PDO no
     * entiende esa sintaxis de psql. El esquema + datos base se restauran
     * con scripts/restore-local-postgres.ps1 (usa psql -f, que sí la entiende)
     * ANTES de correr las migraciones normales. Ver INSTALL.md.
     * Se deja esta migración vacía (en vez de eliminarla) para no romper el
     * historial/orden de migraciones ya aplicado en entornos existentes.
     */
    public function up(): void
    {
        //
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // En migrate:fresh se hará un drop a todo el esquema completo, por lo que 
        // no es necesario realizar drops manuales extensos aquí.
    }
};
