<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('final_competency_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('course_id');
            $table->uuid('competency_id');
            $table->uuid('academic_year_id');
            $table->uuid('source_period_id')->nullable();
            $table->string('final_level', 2);
            $table->string('current_status', 20)->default('vigente');
            $table->boolean('requires_support')->default(false);
            $table->boolean('has_consecutive_c')->default(false);
            $table->text('evidence_note')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'competency_id', 'academic_year_id'],
                'final_comp_results_student_competency_year_unique'
            );
            $table->index(['academic_year_id', 'student_id'], 'final_comp_results_year_student_index');
            $table->index('course_id', 'final_comp_results_course_index');
            $table->index('source_period_id', 'final_comp_results_source_period_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('final_competency_results');
    }
};
