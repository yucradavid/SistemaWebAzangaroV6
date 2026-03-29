<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recovery_processes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('academic_year_id');
            $table->uuid('grade_level_id');
            $table->string('status', 20)->default('pending');
            $table->text('referral_reason')->nullable();
            $table->text('support_plan')->nullable();
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'academic_year_id'], 'recovery_processes_student_year_index');
            $table->index('grade_level_id', 'recovery_processes_grade_level_index');
            $table->index('status', 'recovery_processes_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recovery_processes');
    }
};
