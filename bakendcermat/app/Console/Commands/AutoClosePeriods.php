<?php

namespace App\Console\Commands;

use App\Models\Period;
use App\Services\AcademicPeriodHistoryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class AutoClosePeriods extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'periods:auto-close';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cierra automaticamente los periodos cuya fecha fin ya paso y genera su snapshot historico.';

    /**
     * Execute the console command.
     */
    public function handle(AcademicPeriodHistoryService $historyService): int
    {
        $today = now()->toDateString();

        // Periodos cuya fecha fin ya paso y que aun no estan cerrados.
        $periods = Period::query()
            ->whereDate('end_date', '<', $today)
            ->where('is_closed', false)
            ->orderBy('academic_year_id')
            ->orderBy('period_number')
            ->get();

        if ($periods->isEmpty()) {
            $this->info('No hay periodos para cerrar.');
            return Command::SUCCESS;
        }

        $closed = 0;

        foreach ($periods as $period) {
            $this->info("Cerrando periodo: {$period->name}");

            try {
                DB::transaction(function () use ($period, $historyService) {
                    // Mismo flujo que PeriodController@update: marcar cerrado
                    // y luego generar el snapshot con el periodo ya finalizado.
                    $period->update(['is_closed' => true]);

                    $historyService->generateForPeriod($period->fresh());
                });

                $closed++;
                $this->info("  OK Snapshot generado para: {$period->name}");
            } catch (Throwable $e) {
                $this->error("  ERROR al cerrar {$period->name}: {$e->getMessage()}");
            }
        }

        $this->info("Total cerrados: {$closed} de {$periods->count()}");

        return Command::SUCCESS;
    }
}
