<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Amplia las categorias validas de messages para los avisos automaticos que
 * hoy NO caben en el CHECK:
 *
 *  - 'asistencia': MarkAbsences::notifyGuardianAbsence ya crea mensajes con
 *    esta categoria y el CHECK actual los rechaza con 23514, asi que el
 *    comando attendance:mark-absences revienta apenas un apoderado con cuenta
 *    necesita aviso de falta. La categoria estaba en el codigo pero nunca en
 *    la base.
 *
 *  - 'finanzas': la usara el aviso automatico de cuota proxima a vencer, con
 *    el mismo patron messages + message_recipients + notifications ya usado en
 *    Tutoria Academica y Escuela Vacacional.
 *
 * Solo amplia la lista; no quita ninguna categoria, asi que ningun mensaje ya
 * guardado queda invalido y el down() es seguro mientras no existan filas con
 * las categorias nuevas.
 *
 * NO se toca messages_sender_role_check ni la nulabilidad de sender_id: los
 * otros dos constraints que MarkAbsences viola se corrigen del lado del
 * codigo, resolviendo un Profile emisor real como ya hace la Variante A
 * (AcademicEvaluationService::dispatchVacationalNotifications). Relajar el
 * esquema para acomodar un bug seria al reves.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_category_check');
        DB::statement(
            'ALTER TABLE messages ADD CONSTRAINT messages_category_check '
            ."CHECK (category IN ('general', 'tutoria', 'vacacional', 'asistencia', 'finanzas'))"
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_category_check');
        DB::statement(
            'ALTER TABLE messages ADD CONSTRAINT messages_category_check '
            ."CHECK (category IN ('general', 'tutoria', 'vacacional'))"
        );
    }
};
