<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_qr_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('section_id');
            $table->uuid('academic_year_id');
            $table->date('date');
            $table->string('checkpoint_type', 20);
            $table->string('session_code', 16)->unique();
            $table->string('token', 120)->unique();
            $table->string('status', 20)->default('activo');
            $table->unsignedInteger('late_after_minutes')->default(10);
            $table->timestampTz('opened_at')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('closed_at')->nullable();
            $table->uuid('created_by_profile_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['section_id', 'academic_year_id', 'date'], 'attendance_qr_sessions_section_year_date_idx');
            $table->index(['date', 'checkpoint_type', 'status'], 'attendance_qr_sessions_date_checkpoint_status_idx');

            $table->foreign('section_id')->references('id')->on('sections')->cascadeOnDelete();
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->cascadeOnDelete();
            $table->foreign('created_by_profile_id')->references('id')->on('profiles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_qr_sessions');
    }
};
