<?php

namespace App\Support;

/**
 * Rango estandar de grados por nivel educativo (orden numerico -> nombre).
 * Fuente unica de verdad usada tanto para generar grados faltantes como
 * para validar que el orden numerico de un grado (individual o automatico)
 * no se salga del rango de su nivel.
 */
class StandardGradeCatalog
{
    private const CATALOG = [
        'inicial' => [
            1 => '3 años',
            2 => '4 años',
            3 => '5 años',
        ],
        'primaria' => [
            1 => '1er Grado de Primaria',
            2 => '2do Grado de Primaria',
            3 => '3er Grado de Primaria',
            4 => '4to Grado de Primaria',
            5 => '5to Grado de Primaria',
            6 => '6to Grado de Primaria',
        ],
        'secundaria' => [
            1 => '1er Grado de Secundaria',
            2 => '2do Grado de Secundaria',
            3 => '3er Grado de Secundaria',
            4 => '4to Grado de Secundaria',
            5 => '5to Grado de Secundaria',
        ],
    ];

    public static function levels(): array
    {
        return array_keys(self::CATALOG);
    }

    /** @return array<int, string> orden numerico => nombre estandar */
    public static function forLevel(string $level): array
    {
        return self::CATALOG[$level] ?? [];
    }

    public static function maxGrade(string $level): int
    {
        $range = self::forLevel($level);

        return $range === [] ? 0 : max(array_keys($range));
    }

    public static function isValidGrade(string $level, int $grade): bool
    {
        return array_key_exists($grade, self::forLevel($level));
    }
}
