<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Portadas configurables por página pública (landing, admisión, niveles, etc.),
 * gestionadas desde el módulo admin "Sitio Web". FK a public.users explícita
 * (no auth.users) — ver convención en fix_public_news_user_foreign_keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('site_page_covers')) {
            return;
        }

        Schema::create('site_page_covers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('page_key', 100)->unique();
            $table->string('image_path', 500)->nullable();
            $table->string('alt_text', 255)->nullable();
            $table->string('object_position', 50)->default('center center');
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });

        DB::statement(
            'ALTER TABLE public.site_page_covers
             ADD CONSTRAINT site_page_covers_updated_by_fkey
             FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL'
        );

        $pageKeys = [
            'home',
            'admision',
            'niveles-inicial',
            'niveles-primaria',
            'niveles-secundaria',
            'docentes',
            'noticias',
            'transparencia',
            'contacto',
        ];

        $now = now();
        DB::table('site_page_covers')->insert(array_map(fn (string $key) => [
            'id' => (string) Str::uuid(),
            'page_key' => $key,
            'image_path' => null,
            'alt_text' => null,
            'object_position' => 'center center',
            'updated_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $pageKeys));
    }

    public function down(): void
    {
        Schema::dropIfExists('site_page_covers');
    }
};
