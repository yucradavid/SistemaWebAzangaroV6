<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * La FK student_discounts_assigned_by_fkey apuntaba a auth.users (esquema
     * residual de Supabase) en lugar de public.users (tabla real usada por el
     * modelo User de Laravel). Eso provocaba una violacion de llave foranea al
     * asignar un descuento con un usuario que solo existe en public.users.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE public.student_discounts DROP CONSTRAINT IF EXISTS student_discounts_assigned_by_fkey');

        DB::statement(
            'ALTER TABLE public.student_discounts '
            . 'ADD CONSTRAINT student_discounts_assigned_by_fkey '
            . 'FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE public.student_discounts DROP CONSTRAINT IF EXISTS student_discounts_assigned_by_fkey');

        DB::statement(
            'ALTER TABLE public.student_discounts '
            . 'ADD CONSTRAINT student_discounts_assigned_by_fkey '
            . 'FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL'
        );
    }
};
