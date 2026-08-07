<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Tabla generica de configuracion del sistema (key/value). Primer uso:
 * max_courses_per_teacher, leido por la funcion PL/pgSQL
 * validate_teacher_course_limit() en vez del limite hardcodeado en 6
 * (ver 2026_08_06_000002_make_teacher_course_limit_configurable.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('value');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        DB::table('system_settings')->insert([
            'id' => (string) Str::uuid(),
            'key' => 'max_courses_per_teacher',
            'value' => '6',
            'description' => 'Maximo de cursos que puede dictar un docente simultaneamente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
