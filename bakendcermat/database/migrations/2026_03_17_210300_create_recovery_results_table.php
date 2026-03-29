<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recovery_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('recovery_process_id');
            $table->uuid('competency_id');
            $table->uuid('course_id')->nullable();
            $table->string('initial_level', 2)->nullable();
            $table->string('recovery_level', 2)->nullable();
            $table->string('final_level', 2)->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->unique(
                ['recovery_process_id', 'competency_id'],
                'recovery_results_process_competency_unique'
            );
            $table->index('course_id', 'recovery_results_course_index');
            $table->index('is_resolved', 'recovery_results_resolved_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recovery_results');
    }
};
