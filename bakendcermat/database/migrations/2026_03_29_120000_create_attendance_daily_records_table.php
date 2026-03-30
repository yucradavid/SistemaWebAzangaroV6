<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_daily_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('section_id');
            $table->uuid('academic_year_id');
            $table->date('date');
            $table->string('entry_status', 20)->nullable();
            $table->text('entry_note')->nullable();
            $table->timestampTz('entry_marked_at')->nullable();
            $table->string('entry_source', 20)->nullable();
            $table->string('exit_status', 20)->nullable();
            $table->text('exit_note')->nullable();
            $table->timestampTz('exit_marked_at')->nullable();
            $table->string('exit_source', 20)->nullable();
            $table->uuid('last_recorded_by_profile_id')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'section_id', 'date'], 'attendance_daily_records_student_section_date_unique');
            $table->index(['section_id', 'academic_year_id', 'date'], 'attendance_daily_records_section_year_date_idx');
            $table->index(['student_id', 'date'], 'attendance_daily_records_student_date_idx');

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('last_recorded_by_profile_id')->references('id')->on('profiles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_daily_records');
    }
};
