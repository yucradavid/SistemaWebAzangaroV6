<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_final_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('academic_year_id');
            $table->uuid('grade_level_id');
            $table->string('final_status', 20)->default('pending');
            $table->unsignedSmallInteger('pending_competencies_count')->default(0);
            $table->boolean('recovery_required')->default(false);
            $table->text('decision_reason')->nullable();
            $table->uuid('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'academic_year_id'],
                'student_final_statuses_student_year_unique'
            );
            $table->index('grade_level_id', 'student_final_statuses_grade_level_index');
            $table->index('final_status', 'student_final_statuses_final_status_index');
            $table->index('decided_by', 'student_final_statuses_decided_by_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_final_statuses');
    }
};
