<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Nota final CONSOLIDADA de un curso (no de una competencia individual) —
 * separada de final_competency_results a proposito: esa tabla es UNIQUE por
 * (student_id, competency_id, academic_year_id), un curso puede tener varias
 * competencias, asi que "la nota del curso" no cabe ahi sin forzar un
 * competency_id ficticio. average_score guarda el promedio numerico 0-20
 * usado para derivar final_level (ver AcademicEvaluationService::calculateCourseGrade).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('final_course_grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('course_id');
            $table->uuid('academic_year_id');
            $table->decimal('average_score', 4, 2);
            $table->string('final_level', 5);
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();

            $table->unique(['student_id', 'course_id', 'academic_year_id']);
        });

        DB::statement(
            "ALTER TABLE final_course_grades ADD CONSTRAINT final_course_grades_level_check "
            ."CHECK (final_level IN ('AD', 'A', 'B', 'C'))"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('final_course_grades');
    }
};
