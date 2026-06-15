<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reapunta las FKs de tablas de la APLICACION que por error referenciaban
 * auth.users (esquema residual de Supabase) hacia public.users (tabla real
 * usada por el modelo User de Laravel).
 *
 * Solo se incluyen las FKs SIN filas huerfanas, para evitar perdida de datos.
 * Las 3 FKs con huerfanos (evaluations.recorded_by, students.user_id,
 * guardians.user_id) NO se tocan aqui: requieren una decision aparte porque
 * apuntan a identidades heredadas que solo existen en auth.users.
 *
 * NO se modifican las FKs internas del esquema auth.* (propias de Supabase).
 */
return new class extends Migration
{
    /**
     * [tabla, constraint, columna, clausula_on_delete]
     */
    private array $fks = [
        ['assignment_submissions', 'assignment_submissions_reviewed_by_fkey', 'reviewed_by', 'ON DELETE SET NULL'],
        ['assignments', 'assignments_created_by_fkey', 'created_by', 'ON DELETE SET NULL'],
        ['attendance', 'attendance_recorded_by_fkey', 'recorded_by', 'ON DELETE SET NULL'],
        ['attendance_justifications', 'attendance_justifications_reviewed_by_fkey', 'reviewed_by', 'ON DELETE SET NULL'],
        ['audit_logs', 'audit_logs_user_id_fkey', 'user_id', 'ON DELETE SET NULL'],
        ['cash_closures', 'cash_closures_closed_by_fkey', 'closed_by', 'ON DELETE SET NULL'],
        ['charges', 'charges_created_by_fkey', 'created_by', 'ON DELETE SET NULL'],
        ['notifications', 'notifications_user_id_fkey', 'user_id', 'ON DELETE CASCADE'],
        ['payments', 'payments_received_by_fkey', 'received_by', 'ON DELETE SET NULL'],
        ['profiles', 'profiles_created_by_fkey', 'created_by', ''],
        ['receipts', 'receipts_issued_by_fkey', 'issued_by', 'ON DELETE SET NULL'],
        ['teachers', 'teachers_user_id_fkey', 'user_id', 'ON DELETE SET NULL'],
    ];

    public function up(): void
    {
        foreach ($this->fks as [$table, $constraint, $column, $onDelete]) {
            $this->repoint($table, $constraint, $column, 'public.users', $onDelete);
        }
    }

    public function down(): void
    {
        foreach ($this->fks as [$table, $constraint, $column, $onDelete]) {
            $this->repoint($table, $constraint, $column, 'auth.users', $onDelete);
        }
    }

    private function repoint(string $table, string $constraint, string $column, string $referenced, string $onDelete): void
    {
        DB::statement("ALTER TABLE public.\"$table\" DROP CONSTRAINT IF EXISTS $constraint");

        DB::statement(
            "ALTER TABLE public.\"$table\" "
            . "ADD CONSTRAINT $constraint "
            . "FOREIGN KEY ($column) REFERENCES $referenced(id) "
            . trim($onDelete)
        );
    }
};
