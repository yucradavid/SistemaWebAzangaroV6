<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'administrative'");
    }

    public function down(): void
    {
        // PostgreSQL does not support removing enum values safely in-place.
    }
};
