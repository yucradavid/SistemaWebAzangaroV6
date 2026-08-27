<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Rangos horarios de asistencia por turno (manana/tarde) y checkpoint
 * (entrada/salida), configurables desde admin. Reemplaza el umbral fijo
 * hardcodeado que hoy vive por-sesion-QR (attendance_qr_sessions.late_after_minutes)
 * para el flujo de marcado por auxiliar (checkpoint por codigo/QR de carnet).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_schedule_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('shift');
            $table->string('checkpoint_type');
            $table->time('window_start');
            $table->time('late_after')->nullable();
            $table->time('window_end');
            $table->boolean('is_active')->default(true);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['shift', 'checkpoint_type']);
        });

        $now = now();
        $rows = [
            ['shift' => 'manana', 'checkpoint_type' => 'entrada', 'window_start' => '07:00:00', 'late_after' => '08:15:00', 'window_end' => '10:00:00'],
            ['shift' => 'manana', 'checkpoint_type' => 'salida', 'window_start' => '13:30:00', 'late_after' => null, 'window_end' => '14:30:00'],
            ['shift' => 'tarde', 'checkpoint_type' => 'entrada', 'window_start' => '15:00:00', 'late_after' => '15:30:00', 'window_end' => '16:00:00'],
            ['shift' => 'tarde', 'checkpoint_type' => 'salida', 'window_start' => '17:00:00', 'late_after' => null, 'window_end' => '17:00:00'],
        ];

        foreach ($rows as $row) {
            DB::table('attendance_schedule_config')->insert([
                'id' => (string) Str::uuid(),
                'shift' => $row['shift'],
                'checkpoint_type' => $row['checkpoint_type'],
                'window_start' => $row['window_start'],
                'late_after' => $row['late_after'],
                'window_end' => $row['window_end'],
                'is_active' => true,
                'updated_by' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('system_settings')->insert([
            'id' => (string) Str::uuid(),
            'key' => 'taller_tolerance_minutes',
            'value' => '30',
            'description' => 'Minutos de tolerancia despues de finalizar taller/banda, para la hora limite de salida',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', 'taller_tolerance_minutes')->delete();
        Schema::dropIfExists('attendance_schedule_config');
    }
};
