<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_charge_id_fkey');
        DB::statement('ALTER TABLE payments ALTER COLUMN charge_id DROP NOT NULL');
        DB::statement(
            'ALTER TABLE payments ADD CONSTRAINT payments_charge_id_fkey ' .
            'FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE RESTRICT'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_charge_id_fkey');
        DB::statement('ALTER TABLE payments ALTER COLUMN charge_id SET NOT NULL');
        DB::statement(
            'ALTER TABLE payments ADD CONSTRAINT payments_charge_id_fkey ' .
            'FOREIGN KEY (charge_id) REFERENCES charges(id) ON DELETE RESTRICT'
        );
    }
};
