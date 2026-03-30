<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('public_news') || !Schema::hasTable('users')) {
            return;
        }

        DB::statement('ALTER TABLE public.public_news DROP CONSTRAINT IF EXISTS public_news_created_by_fkey');
        DB::statement('ALTER TABLE public.public_news DROP CONSTRAINT IF EXISTS public_news_updated_by_fkey');

        DB::statement(
            'ALTER TABLE public.public_news
             ADD CONSTRAINT public_news_created_by_fkey
             FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL'
        );

        DB::statement(
            'ALTER TABLE public.public_news
             ADD CONSTRAINT public_news_updated_by_fkey
             FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL'
        );
    }

    public function down(): void
    {
        if (!Schema::hasTable('public_news')) {
            return;
        }

        DB::statement('ALTER TABLE public.public_news DROP CONSTRAINT IF EXISTS public_news_created_by_fkey');
        DB::statement('ALTER TABLE public.public_news DROP CONSTRAINT IF EXISTS public_news_updated_by_fkey');

        if (Schema::hasTable('users')) {
            DB::statement(
                'ALTER TABLE public.public_news
                 ADD CONSTRAINT public_news_created_by_fkey
                 FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL'
            );

            DB::statement(
                'ALTER TABLE public.public_news
                 ADD CONSTRAINT public_news_updated_by_fkey
                 FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL'
            );
        }
    }
};
