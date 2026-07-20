<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Solicitudes de reapertura de notas publicadas: el docente pide permiso,
 * un admin/director/coordinator aprueba (ventana de 24h) o rechaza.
 *
 * Las FKs de usuarios apuntan a public.users (NO auth.users) porque el
 * usuario autenticado por Sanctum es la fila de public.users.
 */
return new class extends Migration
{
    // ALTER TYPE ... ADD VALUE no puede correr dentro de una transaccion en Postgres.
    public $withinTransaction = false;

    public function up(): void
    {
        Schema::create('evaluation_reopen_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('evaluation_id');
            $table->uuid('teacher_id');
            $table->uuid('requested_by');
            $table->text('reason');
            $table->string('status', 20)->default('pendiente');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->foreign('evaluation_id')->references('id')->on('evaluations')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->foreign('requested_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['evaluation_id', 'status']);
            $table->index('status');
        });

        DB::statement(
            'ALTER TABLE evaluation_reopen_requests ADD CONSTRAINT evaluation_reopen_requests_status_check '
            ."CHECK (status IN ('pendiente', 'aprobada', 'rechazada'))"
        );

        DB::statement("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'solicitud_reapertura'");
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_reopen_requests');
        // El valor 'solicitud_reapertura' del enum notification_type no se
        // revierte: Postgres no permite quitar valores sin recrear el tipo.
    }
};
