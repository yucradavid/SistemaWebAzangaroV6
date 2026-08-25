<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Un curso especifico que un estudiante debe recuperar en Escuela Vacacional
 * (nota final C en ese curso, pero el estudiante SI promociona porque tuvo
 * entre 1 y 3 cursos en C — ver AcademicEvaluationService::calculateCourseBasedDecision).
 * Nunca existio antes esta tabla ni el concepto — es funcionalidad 100% nueva.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vacational_school', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('academic_year_id');
            $table->uuid('course_id');
            $table->string('final_grade', 5);
            $table->string('status', 20)->default('pendiente');
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();

            $table->unique(['student_id', 'academic_year_id', 'course_id']);
        });

        DB::statement(
            "ALTER TABLE vacational_school ADD CONSTRAINT vacational_school_status_check "
            ."CHECK (status IN ('pendiente', 'completado'))"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('vacational_school');
    }
};
