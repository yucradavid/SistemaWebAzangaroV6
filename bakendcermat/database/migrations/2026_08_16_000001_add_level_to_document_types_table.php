<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cada tipo de documento pertenece a UN nivel (inicial|primaria|secundaria),
 * igual que grade_levels.level. Si un documento aplica a varios niveles se
 * modela como una fila por nivel (mismo nombre, distinto id), no con un
 * campo multivalor, para mantener el filtro ?level= simple en index().
 *
 * Los 7 document_types ya existentes (creados antes de que "nivel" existiera)
 * tienen filas reales en enrollment_application_documents (FK con cascade
 * delete), asi que no se recrean: se les asigna 'primaria' via DEFAULT, que
 * ademas es exactamente el catalogo que ya tenian.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->string('level', 20)->default('primaria')->after('is_active');
        });

        DB::statement('ALTER TABLE document_types ALTER COLUMN level DROP DEFAULT');
    }

    public function down(): void
    {
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
