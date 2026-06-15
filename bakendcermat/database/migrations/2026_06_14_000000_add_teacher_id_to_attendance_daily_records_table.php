<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_daily_records', function (Blueprint $table) {
            $table->uuid('teacher_id')->nullable()->after('student_id');
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
        });

        DB::statement('ALTER TABLE attendance_daily_records ALTER COLUMN student_id DROP NOT NULL');

        DB::statement(
            'CREATE UNIQUE INDEX attendance_daily_records_teacher_date_unique '
            . 'ON attendance_daily_records (teacher_id, date) WHERE teacher_id IS NOT NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS attendance_daily_records_teacher_date_unique');

        DB::statement('ALTER TABLE attendance_daily_records ALTER COLUMN student_id SET NOT NULL');

        Schema::table('attendance_daily_records', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
            $table->dropColumn('teacher_id');
        });
    }
};
