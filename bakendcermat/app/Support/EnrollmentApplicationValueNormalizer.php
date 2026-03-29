<?php

namespace App\Support;

use Illuminate\Support\Str;

class EnrollmentApplicationValueNormalizer
{
    public const DOCUMENT_TYPES = ['DNI', 'CE', 'Pasaporte'];
    public const GENDERS = ['M', 'F'];
    public const RELATIONSHIPS = ['Padre', 'Madre', 'Tutor', 'Otro'];

    public static function normalizePayload(array $data): array
    {
        if (array_key_exists('student_document_type', $data)) {
            $data['student_document_type'] = self::normalizeDocumentType($data['student_document_type']);
        }

        if (array_key_exists('guardian_document_type', $data)) {
            $data['guardian_document_type'] = self::normalizeDocumentType($data['guardian_document_type']);
        }

        if (array_key_exists('student_gender', $data)) {
            $data['student_gender'] = self::normalizeGender($data['student_gender']);
        }

        if (array_key_exists('guardian_relationship', $data)) {
            $data['guardian_relationship'] = self::normalizeRelationship($data['guardian_relationship']);
        }

        return $data;
    }

    public static function normalizeDocumentType(mixed $value): ?string
    {
        $normalized = self::normalizedKey($value);

        return match ($normalized) {
            'dni' => 'DNI',
            'ce', 'carnet de extranjeria' => 'CE',
            'pasaporte' => 'Pasaporte',
            default => self::normalizeScalar($value),
        };
    }

    public static function normalizeGender(mixed $value): ?string
    {
        $normalized = self::normalizedKey($value);

        return match ($normalized) {
            'm', 'masculino', 'male' => 'M',
            'f', 'femenino', 'female' => 'F',
            default => self::normalizeScalar($value),
        };
    }

    public static function normalizeRelationship(mixed $value): ?string
    {
        $normalized = self::normalizedKey($value);

        return match ($normalized) {
            'padre' => 'Padre',
            'madre' => 'Madre',
            'tutor', 'apoderado' => 'Tutor',
            'abuelo', 'abuela', 'tio', 'tia', 'otro', 'other' => 'Otro',
            default => self::normalizeScalar($value),
        };
    }

    private static function normalizedKey(mixed $value): string
    {
        $scalar = self::normalizeScalar($value);

        if ($scalar === null) {
            return '';
        }

        return Str::of($scalar)
            ->lower()
            ->ascii()
            ->squish()
            ->value();
    }

    private static function normalizeScalar(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
