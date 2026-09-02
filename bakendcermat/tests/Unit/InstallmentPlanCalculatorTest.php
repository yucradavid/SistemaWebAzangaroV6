<?php

namespace Tests\Unit;

use App\Exceptions\InstallmentSplitException;
use App\Services\InstallmentPlanCalculator;
use PHPUnit\Framework\TestCase;

class InstallmentPlanCalculatorTest extends TestCase
{
    private InstallmentPlanCalculator $calc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calc = new InstallmentPlanCalculator;
    }

    /**
     * Suma en centimos: comparar floats con == es justamente lo que este
     * calculador evita, asi que la asercion tambien trabaja en enteros.
     */
    private function sumaEnCentimos(array $cuotas): int
    {
        return array_sum(array_map(static fn ($m) => (int) round($m * 100), $cuotas));
    }

    public function test_la_pension_anual_de_2000_cuadra_exacto_en_3_4_5_y_8_cuotas(): void
    {
        foreach ([3, 4, 5, 8] as $n) {
            $cuotas = $this->calc->split(2000.00, $n);

            $this->assertCount($n, $cuotas, "Debe generar {$n} cuotas");
            $this->assertSame(200000, $this->sumaEnCentimos($cuotas), "La suma de {$n} cuotas debe dar exactamente 2000.00");
        }
    }

    public function test_reparto_exacto_de_2000_en_3_cuotas(): void
    {
        $this->assertSame([666.67, 666.67, 666.66], $this->calc->split(2000.00, 3));
    }

    public function test_cuando_la_division_es_exacta_todas_las_cuotas_son_iguales(): void
    {
        $this->assertSame([250.0, 250.0, 250.0, 250.0, 250.0, 250.0, 250.0, 250.0], $this->calc->split(2000.00, 8));
        $this->assertSame([500.0, 500.0, 500.0, 500.0], $this->calc->split(2000.00, 4));
        $this->assertSame([400.0, 400.0, 400.0, 400.0, 400.0], $this->calc->split(2000.00, 5));
    }

    public function test_totales_feos_siguen_cuadrando_al_centimo(): void
    {
        $casos = [
            [100.00, 3, 10000],
            [999.99, 8, 99999],
            [1234.56, 7, 123456],
            [0.03 + 2500.00, 6, 250003],
            [3333.33, 9, 333333],
        ];

        foreach ($casos as [$total, $n, $esperadoEnCentimos]) {
            $cuotas = $this->calc->split($total, $n);
            $this->assertSame(
                $esperadoEnCentimos,
                $this->sumaEnCentimos($cuotas),
                "Repartir {$total} en {$n} cuotas debe sumar exactamente el total"
            );
        }
    }

    public function test_reparto_de_100_en_3_y_de_999_99_en_8(): void
    {
        $this->assertSame([33.34, 33.34, 33.32], $this->calc->split(100.00, 3));
        $this->assertSame([125.0, 125.0, 125.0, 125.0, 125.0, 125.0, 125.0, 124.99], $this->calc->split(999.99, 8));
    }

    public function test_las_cuotas_iniciales_nunca_son_menores_que_la_ultima(): void
    {
        // Es la regla que protege al colegio: se cobra primero lo grande.
        foreach ([3, 4, 5, 8, 9, 12] as $n) {
            foreach ([2000.00, 100.00, 999.99, 1234.56, 777.77] as $total) {
                $cuotas = $this->calc->split($total, $n);
                $ultima = array_pop($cuotas);

                foreach ($cuotas as $i => $cuota) {
                    $this->assertGreaterThanOrEqual(
                        $ultima,
                        $cuota,
                        'Cuota #'.($i + 1)." de {$total} en {$n} no puede ser menor que la ultima"
                    );
                }
            }
        }
    }

    public function test_ninguna_cuota_es_negativa_ni_cero(): void
    {
        foreach ([2, 3, 4, 5, 8, 10, 12] as $n) {
            foreach ([2000.00, 500.00, 100.00, 999.99] as $total) {
                foreach ($this->calc->split($total, $n) as $i => $cuota) {
                    $this->assertGreaterThan(0, $cuota, 'Cuota #'.($i + 1)." de {$total} en {$n} debe ser positiva");
                }
            }
        }
    }

    public function test_rechaza_cuando_cada_cuota_quedaria_debajo_de_un_sol(): void
    {
        // Es el caso borde que, sin validacion, produciria una ultima cuota
        // negativa: 0.05 repartido en 8 daria base 0.01 y ultima -0.02.
        $this->expectException(InstallmentSplitException::class);
        $this->calc->split(0.05, 8);
    }

    public function test_el_limite_de_un_sol_por_cuota_es_exacto(): void
    {
        // 8.00 en 8 cuotas = 1.00 cada una: pasa, es el limite justo.
        $this->assertSame(800, $this->sumaEnCentimos($this->calc->split(8.00, 8)));

        // 7.99 en 8 cuotas dejaria cuotas por debajo de 1.00: se rechaza.
        $this->expectException(InstallmentSplitException::class);
        $this->calc->split(7.99, 8);
    }

    public function test_rechaza_menos_de_dos_cuotas(): void
    {
        $this->expectException(InstallmentSplitException::class);
        $this->calc->split(2000.00, 1);
    }

    public function test_rechaza_total_cero_o_negativo(): void
    {
        $this->expectException(InstallmentSplitException::class);
        $this->calc->split(0.0, 4);
    }

    public function test_el_mensaje_de_error_explica_el_motivo_al_usuario(): void
    {
        try {
            $this->calc->split(5.00, 8);
            $this->fail('Debio lanzar InstallmentSplitException');
        } catch (InstallmentSplitException $e) {
            $mensaje = $e->errors()['installments_count'][0];
            $this->assertStringContainsString('no alcanza para 8 cuotas', $mensaje);
            $this->assertStringContainsString('S/ 1.00', $mensaje);
        }
    }
}
