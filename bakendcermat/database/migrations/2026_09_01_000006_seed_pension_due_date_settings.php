<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fechas de vencimiento de las pensiones, configurables UNA vez para todo el
 * colegio (no varian por estudiante ni se eligen al aprobar cada matricula):
 *
 *  - pension_first_due_month: mes en que vence la primera pension del
 *    calendario de cuotas (1-12). Default 3 = marzo, inicio del anio escolar.
 *
 *  - pension_due_day: dia del mes en que vencen todas las pensiones (1-28).
 *    Default 5. El tope de 28 es deliberado: con 29, 30 o 31 el vencimiento
 *    de febrero no existiria y habria que inventar una regla de corrimiento
 *    distinta por mes. Con 28 la fecha es valida en los 12 meses del anio.
 *
 * En modalidad cuotas, las N-1 pensiones restantes vencen mensualmente desde
 * ese mes/dia, avanzando un mes por cuota. La matricula y la primera pension
 * -o el cargo consolidado de contado- vencen el MISMO dia de la aprobacion,
 * porque se cobran de inmediato en Finanzas.
 *
 * Mismo patron key/value de system_settings ya usado por
 * max_courses_per_teacher, taller_tolerance_minutes e installment_options
 * (ver 2026_09_01_000005_seed_installment_options_setting).
 *
 * updateOrInsert en vez de insert: hace la migracion idempotente y evita
 * romper con 23505 si alguna clave ya fue creada a mano en algun entorno.
 */
return new class extends Migration
{
    /**
     * @var array<string, array{value: string, description: string}>
     */
    private array $settings = [
        'pension_first_due_month' => [
            'value' => '3',
            'description' => 'Mes (1-12) en que vence la primera pension del calendario de cuotas',
        ],
        'pension_due_day' => [
            'value' => '5',
            'description' => 'Dia del mes (1-28) en que vencen las pensiones',
        ],
    ];

    public function up(): void
    {
        foreach ($this->settings as $key => $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $key],
                [
                    'id' => (string) Str::uuid(),
                    'value' => $setting['value'],
                    'description' => $setting['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('system_settings')
            ->whereIn('key', array_keys($this->settings))
            ->delete();
    }
};
