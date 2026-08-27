<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->text('attendance_qr_code')->nullable()->unique()->after('student_code');
        });

        // Poblar attendance_qr_code con student_code para estudiantes existentes
        DB::table('students')
            ->whereNull('attendance_qr_code')
            ->whereNotNull('student_code')
            ->update(['attendance_qr_code' => DB::raw('student_code')]);
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('attendance_qr_code');
        });
    }
};
