<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guarda el ajuste manual de "saldo inicial" para un dia que todavia no
 * tiene cierre registrado en cash_closures (esa tabla solo gana una fila
 * cuando la caja se CIERRA). Sin esta tabla, "Ajustar saldo inicial" en
 * Caja Diaria solo mutaba estado local en el componente y se perdia al
 * recargar la pagina.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_opening_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('closure_date')->unique();
            $table->decimal('amount', 12, 2);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_opening_balances');
    }
};
