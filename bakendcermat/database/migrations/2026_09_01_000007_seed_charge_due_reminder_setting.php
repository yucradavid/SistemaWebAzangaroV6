<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Dias de anticipacion con que se avisa al apoderado que una cuota esta por
 * vencer, leido por el comando charges:notify-upcoming (agendado a diario a
 * las 07:00 en bootstrap/app.php).
 *
 * El comando compara la fecha de vencimiento con "hoy + N dias" de forma
 * EXACTA, no por rango, para que cada cuota genere su aviso una sola vez
 * aunque el comando corra todos los dias. Cambiar este valor no reenvia
 * avisos ya emitidos: solo desplaza el momento de los siguientes.
 *
 * Mismo patron key/value de system_settings ya usado por
 * max_courses_per_teacher, taller_tolerance_minutes, installment_options,
 * pension_first_due_month y pension_due_day.
 *
 * updateOrInsert en vez de insert: idempotente, no rompe con 23505 si la clave
 * ya fue creada a mano en algun entorno.
 */
return new class extends Migration
{
    private string $key = 'charge_due_reminder_days';

    public function up(): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['key' => $this->key],
            [
                'id' => (string) Str::uuid(),
                'value' => '5',
                'description' => 'Dias de anticipacion para avisar al apoderado que una cuota esta por vencer',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', $this->key)->delete();
    }
};
