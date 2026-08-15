<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Observacion administrativa de matricula: que le falta traer
 * presencialmente al postulante, editable por el admin desde el checklist
 * de documentos en "Solicitudes de Admision". Distinta de `notes`, que es
 * texto libre ingresado por la familia en el formulario publico.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_applications', function (Blueprint $table) {
            $table->text('enrollment_observation')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('enrollment_applications', function (Blueprint $table) {
            $table->dropColumn('enrollment_observation');
        });
    }
};
