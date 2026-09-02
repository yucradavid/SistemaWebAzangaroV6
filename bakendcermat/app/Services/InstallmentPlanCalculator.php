<?php

namespace App\Services;

use App\Exceptions\InstallmentSplitException;

/**
 * Reparto de un monto anual en N cuotas para la modalidad "pago en cuotas".
 *
 * Regla de negocio (cuotas grandes primero, la mas chica al final):
 *
 *   montoBase = ceil((total / N) * 100) / 100   -- redondeo hacia ARRIBA
 *   cuotas 1..N-1 = montoBase
 *   cuota N       = total - montoBase * (N - 1)
 *
 * El orden protege al colegio: si el apoderado deja de pagar antes de
 * terminar, ya se cobro la mayor parte del monto real. Y como la ultima cuota
 * absorbe la diferencia exacta en vez de recalcularse, la suma SIEMPRE cuadra
 * con el total al centimo.
 *
 * Toda la aritmetica se hace en CENTIMOS enteros, no en floats. Con floats,
 * repartir 999.99 en 8 y volver a sumar puede dar 999.9899999999999: para
 * dinero eso no es aceptable, y ademas el cargo se guarda en una columna
 * numeric de Postgres que si es exacta.
 */
class InstallmentPlanCalculator
{
    /**
     * Monto minimo por cuota, en centimos. Por debajo de 1 sol el reparto deja
     * de tener sentido comercial y, ademas, el redondeo hacia arriba podria
     * hacer que montoBase * (N-1) supere el total y la ultima cuota salga
     * NEGATIVA (ej. 0.05 en 8 cuotas). Se rechaza antes de llegar a eso.
     */
    private const MINIMO_POR_CUOTA_EN_CENTIMOS = 100;

    /**
     * @return list<float> Montos por cuota, en orden (cuota 1 primero).
     *
     * @throws InstallmentSplitException Se renderiza como 422 automaticamente.
     */
    public function split(float $total, int $installments): array
    {
        $totalCents = (int) round($total * 100);

        if ($installments < 2) {
            throw new InstallmentSplitException('El pago en cuotas requiere al menos 2 cuotas.');
        }

        if ($totalCents <= 0) {
            throw new InstallmentSplitException('No se puede repartir en cuotas un monto menor o igual a cero.');
        }

        if (intdiv($totalCents, $installments) < self::MINIMO_POR_CUOTA_EN_CENTIMOS) {
            throw new InstallmentSplitException(sprintf(
                'El monto de S/ %s no alcanza para %d cuotas: cada cuota quedaria por debajo de S/ 1.00.',
                number_format($totalCents / 100, 2),
                $installments
            ));
        }

        // ceil de la division en centimos == ceil((total/N)*100)/100 en soles.
        $baseCents = (int) ceil($totalCents / $installments);
        $lastCents = $totalCents - $baseCents * ($installments - 1);

        $cuotas = array_fill(0, $installments - 1, $baseCents);
        $cuotas[] = $lastCents;

        return array_map(static fn (int $cents): float => $cents / 100, $cuotas);
    }
}
