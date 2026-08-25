<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registra que documentos entrego cada SOLICITUD de pre-matricula, cruzando
 * contra el catalogo document_types. Vive en enrollment_applications (no en
 * students) porque el estudiante recien se crea al aprobar la solicitud
 * (ver approve_enrollment_application) — antes de eso no hay student_id.
 * updated_by referencia public.users (el usuario autenticado por Sanctum).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_application_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enrollment_application_id');
            $table->uuid('document_type_id');
            $table->boolean('delivered')->default(false);
            $table->timestampTz('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['enrollment_application_id', 'document_type_id'], 'enrollment_app_documents_app_doctype_unique');

            $table->foreign('enrollment_application_id', 'enrollment_app_documents_application_fk')
                ->references('id')->on('enrollment_applications')->cascadeOnDelete();
            $table->foreign('document_type_id')->references('id')->on('document_types')->cascadeOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_application_documents');
    }
};
