<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Lista de cantidades de cuota que el admin puede ofrecer al aprobar una
 * matricula en modalidad "pago en cuotas". Hasta ahora no existia en ningun
 * lado: ni en system_settings ni en el frontend.
 *
 * Se guarda como CSV en la tabla generica system_settings, siguiendo el mismo
 * patron key/value ya usado por max_courses_per_teacher y
 * taller_tolerance_minutes (ver 2026_08_06_000001_create_system_settings_table).
 * Es configurable por el admin: el valor sembrado aqui es solo el default
 * pedido (3, 4, 5 y 8 cuotas), no una lista cerrada.
 *
 * El porcentaje del descuento por pago al contado NO vive aqui: vive en la
 * tabla discounts atado a su academic_year_id (ver
 * 2026_09_01_000001_add_year_and_concept_scope_to_discounts), porque debe
 * poder cambiar por anio y quedar auditado como cualquier otro descuento.
 *
 * updateOrInsert en vez de insert: hace la migracion idempotente y evita
 * romper con 23505 si la clave ya fue creada a mano en algun entorno.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['key' => 'installment_options'],
            [
                'id' => (string) Str::uuid(),
                'value' => '3,4,5,8',
                'description' => 'Cantidades de cuota disponibles al aprobar una matricula en modalidad cuotas (lista separada por comas)',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', 'installment_options')->delete();
    }
};
