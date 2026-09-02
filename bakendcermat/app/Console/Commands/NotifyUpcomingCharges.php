<?php

namespace App\Console\Commands;

use App\Models\Charge;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Services\GuardianNoticeService;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Avisa a los apoderados que una cuota esta por vencer.
 *
 * Solo aplica a la modalidad "pago en cuotas": el pago al contado se cobra
 * completo el dia de la aprobacion y no tiene vencimientos futuros que
 * recordar. En la practica eso sale solo, porque un cargo de contado ya
 * vencido nunca coincide con "hoy + N dias".
 *
 * WhatsApp NO se envia desde aqui: el proyecto no tiene integracion de
 * servidor con ningun proveedor (lo unico existente son enlaces wa.me que abre
 * el navegador). El aviso por WhatsApp queda como accion manual desde la lista
 * de cobros, reutilizando ese mismo patron.
 */
class NotifyUpcomingCharges extends Command
{
    protected $signature = 'charges:notify-upcoming
                            {--days= : Dias de anticipacion (default: system_settings.charge_due_reminder_days)}
                            {--date= : Fecha de referencia en formato Y-m-d (default: hoy)}
                            {--dry-run : Muestra a quien avisaria sin escribir nada}';

    protected $description = 'Notifica a los apoderados las cuotas proximas a vencer';

    public function __construct(
        private readonly GuardianNoticeService $guardianNotices
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $days = $this->resolveDays();
        $reference = $this->option('date')
            ? Carbon::parse($this->option('date'))->startOfDay()
            : Carbon::now()->startOfDay();

        // Coincidencia EXACTA con hoy + N dias, no un rango: asi cada cuota
        // genera su aviso una sola vez y el comando puede correr a diario sin
        // convertirse en spam.
        $targetDate = $reference->copy()->addDays($days);
        $dryRun = (bool) $this->option('dry-run');

        $this->info("Cuotas que vencen el {$targetDate->toDateString()} (hoy {$reference->toDateString()} + {$days} dias)");

        $charges = Charge::query()
            ->with(['student.guardians', 'concept'])
            ->whereDate('due_date', $targetDate->toDateString())
            ->whereNull('voided_at')
            ->whereIn('status', ['pendiente', 'pagado_parcial'])
            ->orderBy('student_id')
            ->get();

        if ($charges->isEmpty()) {
            $this->line('  No hay cuotas que venzan en esa fecha.');

            return Command::SUCCESS;
        }

        $avisados = 0;
        $omitidos = 0;

        foreach ($charges as $charge) {
            if ($this->alreadyNotified($charge)) {
                $omitidos++;
                $this->line("  - {$charge->student?->full_name}: ya se aviso antes de esta cuota, se omite.");

                continue;
            }

            $student = $charge->student;

            if (! $student) {
                $omitidos++;

                continue;
            }

            $pendiente = round((float) $charge->final_amount - (float) $charge->paid_amount, 2);
            $concepto = $charge->concept?->name ?? 'Cuota';

            $title = 'Cuota proxima a vencer';
            $message = sprintf(
                'La %s de %s vence el %s. Monto pendiente: S/ %s.',
                $charge->notes ?: $concepto,
                $student->full_name,
                $charge->due_date->format('d/m/Y'),
                number_format($pendiente, 2)
            );

            if ($dryRun) {
                $this->line("  [dry-run] {$student->full_name}: {$message}");
                $avisados++;

                continue;
            }

            $notificados = $this->guardianNotices->notifyGuardians(
                $student,
                $title,
                $message,
                'finanzas',
                // Se reutiliza el valor que ya existe en el enum
                // notification_type en vez de agregar uno nuevo: agregar
                // valores a un enum de Postgres es irreversible sin recrear
                // el tipo, y 'recordatorio_pago' describe exactamente esto.
                'recordatorio_pago',
                'charge',
                $charge->id
            );

            if ($notificados > 0) {
                $avisados++;
                $this->line("  + {$student->full_name}: {$notificados} apoderado(s) avisado(s) | S/ ".number_format($pendiente, 2));
            } else {
                $omitidos++;
                $this->line("  - {$student->full_name}: sin apoderados con cuenta, no se pudo avisar.");
            }
        }

        $this->info("Cuotas revisadas: {$charges->count()} | avisadas: {$avisados} | omitidas: {$omitidos}");

        return Command::SUCCESS;
    }

    /**
     * Evita el aviso repetido si el comando corre dos veces el mismo dia.
     * Se apoya en related_entity_type/related_entity_id, que ya existen en
     * notifications, en vez de agregar una tabla de control.
     */
    private function alreadyNotified(Charge $charge): bool
    {
        return Notification::query()
            ->where('related_entity_type', 'charge')
            ->where('related_entity_id', $charge->id)
            ->where('type', 'recordatorio_pago')
            ->exists();
    }

    private function resolveDays(): int
    {
        if ($this->option('days') !== null) {
            return max(0, (int) $this->option('days'));
        }

        $value = SystemSetting::query()->where('key', 'charge_due_reminder_days')->value('value');

        return max(0, (int) ($value ?? 5));
    }
}
