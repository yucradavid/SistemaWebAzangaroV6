<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Titulo corto del mensaje. Obligatorio solo para category='tutoria'
 * (validado en StoreMessageRequest), opcional/nulo para mensajes generales
 * docente<->apoderado que ya funcionan sin titulo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('title', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
