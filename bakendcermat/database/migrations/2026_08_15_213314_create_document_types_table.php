<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Catalogo configurable de tipos de documento requeridos en matricula
 * (copia de DNI, partida de nacimiento, etc). El admin puede agregar,
 * editar o desactivar tipos desde el modulo "Tipos de Documento".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        $seed = [
            ['name' => 'Copia de DNI del estudiante', 'description' => null, 'is_required' => true, 'display_order' => 1],
            ['name' => 'Copia de DNI del apoderado', 'description' => null, 'is_required' => true, 'display_order' => 2],
            ['name' => 'Partida de nacimiento', 'description' => null, 'is_required' => true, 'display_order' => 3],
            ['name' => 'Certificado de estudios (traslado)', 'description' => 'Solo aplica si el estudiante proviene de otra institucion.', 'is_required' => false, 'display_order' => 4],
            ['name' => 'Foto tamaño carnet', 'description' => null, 'is_required' => true, 'display_order' => 5],
            ['name' => 'Certificado de vacunas', 'description' => 'Aplica a niveles inicial y primaria.', 'is_required' => false, 'display_order' => 6],
            ['name' => 'Ficha unica de matricula', 'description' => 'Solo si el proceso de admision lo exige.', 'is_required' => false, 'display_order' => 7],
        ];

        DB::table('document_types')->insert(array_map(fn (array $row) => [
            'id' => (string) Str::uuid(),
            'name' => $row['name'],
            'description' => $row['description'],
            'is_required' => $row['is_required'],
            'display_order' => $row['display_order'],
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $seed));
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
