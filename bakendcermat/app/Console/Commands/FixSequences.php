<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixSequences extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:fix-sequences {--dry-run : Solo mostrar que se corregiria, sin aplicar cambios}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resincroniza las secuencias de PostgreSQL (serial/bigserial/identity) del esquema public con el MAX(id) real de cada tabla. No modifica ninguna fila, solo el contador interno de la secuencia.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->error('Este comando solo aplica a conexiones PostgreSQL.');

            return Command::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        // Descubre toda secuencia del esquema public que este "owned by"
        // una columna de una tabla (cubre serial, bigserial e identity),
        // sin depender de una lista fija de nombres de tabla.
        $sequences = DB::select(<<<'SQL'
            SELECT n.nspname AS schema_name,
                   t.relname AS table_name,
                   a.attname AS column_name,
                   s.relname AS sequence_name
            FROM pg_class s
            JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
            JOIN pg_class t ON d.refobjid = t.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE s.relkind = 'S' AND n.nspname = 'public'
            ORDER BY t.relname
        SQL);

        if (empty($sequences)) {
            $this->info('No se encontraron secuencias en el esquema public.');

            return Command::SUCCESS;
        }

        $fixed = 0;
        $alreadyOk = 0;

        foreach ($sequences as $seq) {
            $table = $seq->table_name;
            $column = $seq->column_name;
            $sequenceFqn = $seq->schema_name.'.'.$seq->sequence_name;

            $maxId = DB::table($table)->max($column);

            $lastValueRow = DB::selectOne(
                'SELECT last_value FROM pg_sequences WHERE schemaname = ? AND sequencename = ?',
                [$seq->schema_name, $seq->sequence_name]
            );
            $currentValue = (int) ($lastValueRow->last_value ?? 0);
            $expected = (int) ($maxId ?? 0);

            if ($currentValue >= $expected) {
                $this->line("  OK   {$table}.{$column} (secuencia={$currentValue}, max_id={$expected})");
                $alreadyOk++;

                continue;
            }

            $this->warn("  FIX  {$table}.{$column}: secuencia={$currentValue} -> ".($maxId ?? 1)." (max_id real=".($maxId ?? 'NULL').")");

            if (! $dryRun) {
                if ($maxId === null) {
                    DB::statement('SELECT setval(?, 1, false)', [$sequenceFqn]);
                } else {
                    DB::statement('SELECT setval(?, ?, true)', [$sequenceFqn, $maxId]);
                }
            }

            $fixed++;
        }

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info("{$prefix}Secuencias revisadas: ".count($sequences)." | ya correctas: {$alreadyOk} | corregidas: {$fixed}");

        return Command::SUCCESS;
    }
}
