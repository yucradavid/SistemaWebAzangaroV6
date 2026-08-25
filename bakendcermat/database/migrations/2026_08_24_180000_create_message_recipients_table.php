<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Destinatarios individuales de un mensaje (Tutoria Academica): permite que
 * un mismo mensaje tenga lectura independiente para el estudiante y el
 * apoderado, sin tocar messages.is_read (que sigue siendo el estado
 * compartido del hilo docente<->apoderado ya existente).
 *
 * Las FKs de usuario apuntan a public.users (no auth.users), igual que el
 * resto de FKs de usuario en este proyecto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_recipients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('message_id');
            $table->string('recipient_type', 20);
            $table->uuid('recipient_user_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreign('recipient_user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index(['recipient_type', 'recipient_user_id']);
            $table->unique(['message_id', 'recipient_type', 'recipient_user_id']);
        });

        DB::statement(
            'ALTER TABLE message_recipients ADD CONSTRAINT message_recipients_recipient_type_check '
            ."CHECK (recipient_type IN ('student', 'guardian'))"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('message_recipients');
    }
};
