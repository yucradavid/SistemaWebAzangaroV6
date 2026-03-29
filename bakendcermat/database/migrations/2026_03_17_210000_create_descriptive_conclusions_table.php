<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('descriptive_conclusions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('competency_id');
            $table->uuid('period_id');
            $table->uuid('academic_year_id');
            $table->string('achievement_level', 2);
            $table->text('conclusion_text');
            $table->text('difficulties')->nullable();
            $table->text('recommendations')->nullable();
            $table->text('support_actions')->nullable();
            $table->boolean('needs_support')->default(false);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'competency_id', 'period_id'],
                'desc_conclusions_student_competency_period_unique'
            );
            $table->index(['academic_year_id', 'student_id'], 'desc_conclusions_year_student_index');
            $table->index('competency_id', 'desc_conclusions_competency_index');
            $table->index('created_by', 'desc_conclusions_created_by_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('descriptive_conclusions');
    }
};
