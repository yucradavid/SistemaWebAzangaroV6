<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Completa el catalogo con los documentos de Inicial y Secundaria (Primaria
 * ya existia con estas mismas 7 filas antes de que "nivel" se introdujera).
 * Sugerencias basadas en requisitos comunes de colegios privados en Peru
 * (RENIEC/SIAGIE/normativa MINEDU de matricula) — el admin puede editar,
 * agregar o desactivar cualquiera desde "Tipos de Documento".
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $inicial = [
            ['name' => 'Copia de DNI del estudiante', 'description' => null, 'is_required' => true, 'display_order' => 1],
            ['name' => 'Copia de DNI del apoderado', 'description' => null, 'is_required' => true, 'display_order' => 2],
            ['name' => 'Partida de nacimiento', 'description' => null, 'is_required' => true, 'display_order' => 3],
            ['name' => 'Certificado de nacido vivo', 'description' => 'Solicitado por algunos colegios como respaldo adicional de la partida.', 'is_required' => false, 'display_order' => 4],
            ['name' => 'Carné de vacunas actualizado', 'description' => null, 'is_required' => true, 'display_order' => 5],
            ['name' => 'Foto tamaño carnet', 'description' => '2 fotos tamaño carnet.', 'is_required' => true, 'display_order' => 6],
            ['name' => 'Ficha de matrícula del sistema', 'description' => 'Solo si el proceso de admision lo exige.', 'is_required' => false, 'display_order' => 7],
        ];

        $secundaria = [
            ['name' => 'Copia de DNI del estudiante', 'description' => null, 'is_required' => true, 'display_order' => 1],
            ['name' => 'Copia de DNI del apoderado', 'description' => null, 'is_required' => true, 'display_order' => 2],
            ['name' => 'Partida de nacimiento', 'description' => null, 'is_required' => true, 'display_order' => 3],
            ['name' => 'Certificado de estudios del año anterior', 'description' => 'Obligatorio en secundaria, no solo para traslados.', 'is_required' => true, 'display_order' => 4],
            ['name' => 'Ficha única de matrícula / constancia de no adeudar', 'description' => 'Solo aplica si el estudiante proviene de otra institucion.', 'is_required' => false, 'display_order' => 5],
            ['name' => 'Foto tamaño carnet', 'description' => '2 fotos tamaño carnet.', 'is_required' => true, 'display_order' => 6],
            ['name' => 'Certificado de conducta', 'description' => 'Solicitado por algunos colegios, especialmente en traslados.', 'is_required' => false, 'display_order' => 7],
        ];

        $rows = [];
        foreach (['inicial' => $inicial, 'secundaria' => $secundaria] as $level => $documents) {
            foreach ($documents as $doc) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'name' => $doc['name'],
                    'description' => $doc['description'],
                    'is_required' => $doc['is_required'],
                    'display_order' => $doc['display_order'],
                    'is_active' => true,
                    'level' => $level,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('document_types')->insert($rows);
    }

    public function down(): void
    {
        DB::table('document_types')->whereIn('level', ['inicial', 'secundaria'])->delete();
    }
};
