<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * NULL = el docente usa el limite global (system_settings.max_courses_per_teacher).
 * Un numero = limite especifico para ESE docente, tiene prioridad sobre el global
 * (ver 2026_08_06_000004_teacher_course_limit_prioritizes_teacher_override.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->integer('max_courses_override')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn('max_courses_override');
        });
    }
};
