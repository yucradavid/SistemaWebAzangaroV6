<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_period_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignUuid('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at');
            $table->boolean('is_finalized')->default(false);
            $table->unsignedInteger('students_count')->default(0);
            $table->unsignedInteger('evaluations_count')->default(0);
            $table->unsignedInteger('attendance_count')->default(0);
            $table->unsignedInteger('assignments_count')->default(0);
            $table->unsignedInteger('task_submissions_count')->default(0);
            $table->unsignedInteger('assignment_submissions_count')->default(0);
            $table->unsignedInteger('messages_count')->default(0);
            $table->json('summary')->nullable();
            $table->timestamps();

            $table->unique('period_id', 'academic_period_histories_period_unique');
            $table->index('academic_year_id', 'academic_period_histories_year_index');
            $table->index('generated_at', 'academic_period_histories_generated_at_index');
        });

        Schema::create('academic_period_student_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academic_period_history_id', 'period_student_snapshots_history_fk')
                ->constrained('academic_period_histories')
                ->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->uuid('section_id')->nullable();
            $table->string('student_code')->nullable();
            $table->string('student_name');
            $table->json('snapshot');
            $table->timestamps();

            $table->unique(
                ['academic_period_history_id', 'student_id'],
                'academic_period_student_snapshots_unique'
            );
            $table->index('student_id', 'academic_period_student_snapshots_student_index');
            $table->index('section_id', 'academic_period_student_snapshots_section_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_period_student_snapshots');
        Schema::dropIfExists('academic_period_histories');
    }
};
