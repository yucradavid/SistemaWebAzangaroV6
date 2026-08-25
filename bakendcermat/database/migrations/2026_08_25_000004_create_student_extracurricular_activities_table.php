<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Taller/Banda: asignacion flexible de horario extendido por alumno
 * (individual, varios, o toda una seccion). Sin relacion con pagos/matricula.
 * Su unico efecto es extender la hora limite de salida del alumno cuando
 * se calcula el checkpoint de asistencia (ver PARTE 4B).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_extracurricular_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->string('activity_name');
            $table->time('activity_end_time');
            $table->uuid('academic_year_id');
            $table->boolean('is_active')->default(true);
            $table->uuid('assigned_by')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->index(['student_id', 'academic_year_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_extracurricular_activities');
    }
};
