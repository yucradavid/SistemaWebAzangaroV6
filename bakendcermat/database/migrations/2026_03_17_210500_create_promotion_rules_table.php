<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('education_level', 20);
            $table->string('cycle_code', 20)->nullable();
            $table->unsignedTinyInteger('grade_number')->nullable();
            $table->string('rule_name', 120);
            $table->string('promotion_mode', 60)->default('minimum_b_half_all_competencies');
            $table->unsignedTinyInteger('promotion_area_count')->nullable();
            $table->string('min_expected_level', 2)->default('A');
            $table->string('minimum_level_for_remaining_competencies', 2)->nullable();
            $table->unsignedSmallInteger('max_b_competencies')->nullable();
            $table->unsignedSmallInteger('max_c_competencies')->nullable();
            $table->string('permanence_mode', 60)->default('c_more_than_half_in_n_areas');
            $table->unsignedTinyInteger('permanence_area_count')->nullable();
            $table->boolean('requires_recovery_for_c')->default(true);
            $table->boolean('allows_guided_promotion')->default(false);
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(
                ['education_level', 'grade_number', 'active'],
                'promotion_rules_level_grade_active_index'
            );
            $table->index('cycle_code', 'promotion_rules_cycle_code_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_rules');
    }
};
