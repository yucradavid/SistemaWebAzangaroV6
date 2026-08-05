<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Repara de forma generica el patron recurrente de usuarios huerfanos: FKs de
 * la app que aun apuntan a auth.users (esquema residual de Supabase) con
 * valores cuyo id no existe en public.users (la copia auth.users ->
 * public.users nunca se completo para esos ids). El set de columnas
 * afectadas cambia segun el snapshot del dump restaurado -una lista fija ya
 * quedo corta dos veces (2026_06_14_000002 y 000003)-, asi que esta
 * migracion descubre las FKs dinamicamente via information_schema en vez de
 * hardcodear tablas/columnas.
 *
 * Por cada FK de public.* -> auth.users(id):
 *   1. encuentra valores huerfanos (existen en la columna, no en public.users)
 *   2. si el email del huerfano ya existe en public.users, remapea la
 *      referencia al id existente (no duplica)
 *   3. si no, copia el usuario de auth.users a public.users con password
 *      temporal aleatorio (o un placeholder sin email si ni siquiera existe
 *      en auth.users, para no perder la referencia)
 *   4. repunta la FK hacia public.users(id), preservando el ON DELETE original
 *
 * Debe correr ANTES de cualquier migracion que asuma FKs ya apuntando a
 * public.users (2026_06_14_000002 y 2026_06_14_000003) - de ahi el timestamp
 * anterior a esas dos. Ambas quedan como no-ops seguros una vez que esta
 * corre primero (repuntan una FK que ya apunta a public.users sin huerfanos).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $fks = DB::select("
            SELECT
                tc.table_name,
                kcu.column_name,
                tc.constraint_name,
                rc.delete_rule
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
                ON rc.unique_constraint_name = ccu.constraint_name AND rc.unique_constraint_schema = ccu.constraint_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
              AND ccu.table_schema = 'auth'
              AND ccu.table_name = 'users'
              AND ccu.column_name = 'id'
            ORDER BY tc.table_name, kcu.column_name
        ");

        if (empty($fks)) {
            return;
        }

        $migrated = [];  // uid => [email, temp_password]
        $remapped = [];  // uid => [orphan_id, existing_id, email]
        $now = now();

        foreach ($fks as $fk) {
            $table = $fk->table_name;
            $column = $fk->column_name;

            // Soltar la FK vieja (hacia auth.users) ANTES de tocar los datos:
            // el remapeo por email de abajo apunta ids a public.users, lo que
            // violaria la constraint vieja si esta siguiera activa.
            DB::statement("ALTER TABLE public.\"$table\" DROP CONSTRAINT IF EXISTS {$fk->constraint_name}");

            $orphans = DB::select("
                SELECT DISTINCT t.\"$column\" AS uid
                FROM public.\"$table\" t
                LEFT JOIN public.users pu ON pu.id = t.\"$column\"
                WHERE t.\"$column\" IS NOT NULL AND pu.id IS NULL
            ");

            foreach ($orphans as $o) {
                $orphanId = (string) $o->uid;

                if (DB::table('users')->where('id', $orphanId)->exists()) {
                    // ya se copio al resolver la misma persona en otra FK de esta corrida
                    continue;
                }

                $authUser = DB::table('auth.users')->where('id', $orphanId)->first();
                $email = $authUser->email ?? null;

                $existingId = $email
                    ? DB::table('users')->where('email', $email)->value('id')
                    : null;

                if ($existingId) {
                    DB::table($table)->where($column, $orphanId)->update([$column => $existingId]);
                    $remapped[$orphanId] = [$orphanId, (string) $existingId, $email];
                    continue;
                }

                $tempPassword = Str::random(12);
                DB::table('users')->insert([
                    'id' => $orphanId,
                    'name' => $email ? Str::before($email, '@') : null,
                    'email' => $email,
                    'password' => Hash::make($tempPassword),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $migrated[$orphanId] = [$email ?? '(sin email, no existia en auth.users)', $tempPassword];
            }

            $onDeleteClause = match (strtoupper(trim((string) $fk->delete_rule))) {
                'SET NULL' => 'ON DELETE SET NULL',
                'CASCADE' => 'ON DELETE CASCADE',
                'RESTRICT' => 'ON DELETE RESTRICT',
                'SET DEFAULT' => 'ON DELETE SET DEFAULT',
                default => '',
            };

            DB::statement(
                "ALTER TABLE public.\"$table\" ADD CONSTRAINT {$fk->constraint_name} "
                . "FOREIGN KEY (\"$column\") REFERENCES public.users(id) $onDeleteClause"
            );
        }

        $this->writeLog(array_values($migrated), array_values($remapped));
    }

    public function down(): void
    {
        // No se revierte: no es seguro distinguir usuarios copiados de altas
        // legitimas posteriores, y el repunte de FKs lo gestionan 000002/000003.
    }

    private function writeLog(array $migrated, array $remapped): void
    {
        if (empty($migrated) && empty($remapped)) {
            return;
        }

        $path = storage_path('logs/migrated-orphan-users-' . now()->format('Ymd-His') . '.log');
        $lines = [];
        $lines[] = '=== Usuarios huerfanos migrados de auth.users -> public.users ===';
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

        Log::warning('Migracion generica de usuarios huerfanos completada', [
            'insertados' => count($migrated),
            'remapeados' => count($remapped),
            'log_file' => $path,
        ]);
    }
};
