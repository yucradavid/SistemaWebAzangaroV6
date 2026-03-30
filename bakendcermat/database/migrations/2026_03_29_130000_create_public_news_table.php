<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tabla para noticias y eventos públicos usada por el frontend (NoticiasList + NewsManagement).
     */
    public function up(): void
    {
        if (Schema::hasTable('public_news')) {
            return;
        }

        Schema::create('public_news', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 255);
            $table->string('slug', 255)->unique()->nullable();
            $table->text('excerpt');
            $table->text('content')->nullable();
            $table->string('image_url', 1000)->nullable();
            $table->string('category', 50)->default('institucional');
            $table->string('author', 255)->default('Dirección General');
            $table->string('status', 20)->default('borrador');
            $table->boolean('is_featured')->default(false);
            $table->timestampTz('published_at')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->cascadeOnDelete();

            $table->index('category');
            $table->index('status');
            $table->index('is_featured');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_news');
    }
};
