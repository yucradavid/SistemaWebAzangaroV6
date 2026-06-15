<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Opcion B: en lugar de nullar los vinculos huerfanos, se copian las filas
 * faltantes de auth.users a public.users (solo id + email) con un password
 * temporal aleatorio, de modo que las 3 FKs restantes puedan apuntar a
 * public.users sin perder ningun dato.
 *
 * Caso especial: si el email del huerfano YA existe en public.users (con otro
 * id), no se puede duplicar (indice unico users_email_key). En ese caso se
 * remapean las referencias al usuario existente (correccion, no null).
 *
 * Las 3 FKs corregidas: students.user_id, guardians.user_id,
 * evaluations.recorded_by  (todas ON DELETE SET NULL).
 */
return new class extends Migration
{
    /** [tabla, columna] que referencian usuarios y tenian huerfanos */
    private array $refs = [
        ['students', 'user_id'],
        ['guardians', 'user_id'],
        ['evaluations', 'recorded_by'],
    ];

    public function up(): void
    {
        // 0) Soltar primero las 3 FKs viejas (aun apuntan a auth.users). Esto es
        //    imprescindible: el remap de referencias huerfanas violaria la FK
        //    vieja si esta siguiera activa.
        foreach ($this->refs as [$table, $column]) {
            DB::statement("ALTER TABLE public.\"$table\" DROP CONSTRAINT IF EXISTS {$table}_{$column}_fkey");
        }

        // 1) IDs huerfanos distintos referenciados por las 3 columnas,
        //    presentes en auth.users pero NO en public.users.
        $orphans = DB::select(<<<SQL
            SELECT DISTINCT v.uid, a.email
            FROM (
                SELECT user_id AS uid FROM public.students WHERE user_id IS NOT NULL
                UNION SELECT user_id FROM public.guardians WHERE user_id IS NOT NULL
                UNION SELECT recorded_by FROM public.evaluations WHERE recorded_by IS NOT NULL
            ) v
            JOIN auth.users a ON a.id = v.uid
            WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = v.uid)
        SQL);

        $migrated = [];   // [email, temp_password]
        $remapped = [];   // [orphan_id, existing_id, email]
        $now = now();

        foreach ($orphans as $o) {
            $orphanId = (string) $o->uid;
            $email = $o->email;

            // Colision de email: el usuario ya existe en public.users con otro id.
            $existingId = $email
                ? DB::table('users')->where('email', $email)->value('id')
                : null;

            if ($existingId) {
                // Remapear las referencias al usuario existente (no duplicar).
                foreach ($this->refs as [$table, $column]) {
                    DB::table($table)->where($column, $orphanId)->update([$column => $existingId]);
                }
                $remapped[] = [$orphanId, (string) $existingId, $email];
                continue;
            }

            // Copiar id + email a public.users con password temporal aleatorio.
            $tempPassword = Str::random(12);
            DB::table('users')->insert([
                'id' => $orphanId,
                'email' => $email,
                'password' => Hash::make($tempPassword),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $migrated[] = [$email ?? '(sin email)', $tempPassword];
        }

        // 2) Guardar log con los emails + passwords temporales para el admin.
        $this->writeLog($migrated, $remapped);

        // 3) Recrear las 3 FKs hacia public.users (preservando ON DELETE SET NULL).
        //    Las viejas ya se soltaron en el paso 0.
        foreach ($this->refs as [$table, $column]) {
            $constraint = "{$table}_{$column}_fkey";
            DB::statement(
                "ALTER TABLE public.\"$table\" ADD CONSTRAINT $constraint "
                . "FOREIGN KEY ($column) REFERENCES public.users(id) ON DELETE SET NULL"
            );
        }
    }

    public function down(): void
    {
        // Reapuntar las FKs de vuelta a auth.users. No se eliminan los usuarios
        // copiados (no es seguro distinguirlos de altas legitimas posteriores).
        foreach ($this->refs as [$table, $column]) {
            $constraint = "{$table}_{$column}_fkey";
            DB::statement("ALTER TABLE public.\"$table\" DROP CONSTRAINT IF EXISTS $constraint");
            DB::statement(
                "ALTER TABLE public.\"$table\" ADD CONSTRAINT $constraint "
                . "FOREIGN KEY ($column) REFERENCES auth.users(id) ON DELETE SET NULL"
            );
        }
    }

    private function writeLog(array $migrated, array $remapped): void
    {
        $path = storage_path('logs/migrated-users-' . now()->format('Ymd-His') . '.log');
        $lines = [];
        $lines[] = '=== Usuarios migrados de auth.users -> public.users ===';
        $lines[] = 'Fecha: ' . now()->toDateTimeString();
        $lines[] = '';
        $lines[] = '-- Insertados (enviar credenciales nuevas) --';
        $lines[] = 'email | password_temporal';
        foreach ($migrated as [$email, $temp]) {
            $lines[] = $email . ' | ' . $temp;
        }
        $lines[] = '';
        $lines[] = '-- Remapeados a usuario existente (no requieren credenciales) --';
        $lines[] = 'orphan_id | existing_id | email';
        foreach ($remapped as [$oid, $eid, $email]) {
            $lines[] = $oid . ' | ' . $eid . ' | ' . $email;
        }

        file_put_contents($path, implode(PHP_EOL, $lines) . PHP_EOL);

        Log::warning('Migracion de usuarios huerfanos completada', [
            'insertados' => count($migrated),
            'remapeados' => count($remapped),
            'log_file' => $path,
        ]);
    }
};
