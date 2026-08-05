<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Esta migración se encarga de importar la estructura base (las tablas de negocio)
     * provenientes del dump de la base de datos (backupcole.sql). 
     * Con esto, al ejecutar php artisan migrate:fresh las tablas base se restauran primero.
     */
    public function up(): void
    {
        $sqlPath = base_path('backupcole.sql');
        
        if (file_exists($sqlPath)) {
            DB::unprepared(file_get_contents($sqlPath));
        } else {
            // Imprime un aviso si el archivo no existe (para entornos de producción/staging sin el archivo)
            // Se asume que en otros entornos el esquema ya existe o se manejará por otros medios.
            if (app()->environment('local')) {
                echo "\n[WARNING] No se encontró el archivo backupcole.sql en el directorio base.\n";
            }
        }
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
