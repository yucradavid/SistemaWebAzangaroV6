<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->foreignUuid('user_id')->nullable()->unique()->after('id');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('profiles', 'user_id')) {
            DB::statement('alter table "profiles" drop constraint if exists profiles_user_id_foreign');

            Schema::table('profiles', function (Blueprint $table) {
                $table->dropColumn('user_id');
            });
        }
    }
};
