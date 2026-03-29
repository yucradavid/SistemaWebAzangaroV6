<?php

namespace App\Support;

class UserRoleCatalog
{
    private const ROLES = [
        'admin' => [
            'label' => 'Administrador',
            'record_type' => 'profile_only',
        ],
        'director' => [
            'label' => 'Director',
            'record_type' => 'profile_only',
        ],
        'coordinator' => [
            'label' => 'Coordinador',
            'record_type' => 'profile_only',
        ],
        'secretary' => [
            'label' => 'Secretaria',
            'record_type' => 'profile_only',
        ],
        'teacher' => [
            'label' => 'Docente',
            'record_type' => 'teacher',
            'entity_table' => 'teachers',
        ],
        'student' => [
            'label' => 'Estudiante',
            'record_type' => 'student',
            'entity_table' => 'students',
        ],
        'guardian' => [
            'label' => 'Apoderado',
            'record_type' => 'guardian',
            'entity_table' => 'guardians',
        ],
        'cashier' => [
            'label' => 'Caja',
            'record_type' => 'profile_only',
        ],
        'administrative' => [
            'label' => 'Administrativo',
            'record_type' => 'profile_only',
        ],
        'finance' => [
            'label' => 'Finanzas',
            'record_type' => 'profile_only',
        ],
        'web_editor' => [
            'label' => 'Editor Web',
            'record_type' => 'profile_only',
        ],
    ];

    public static function values(): array
    {
        return array_keys(self::ROLES);
    }

    public static function exists(string $role): bool
    {
        return array_key_exists($role, self::ROLES);
    }

    public static function metadata(string $role): ?array
    {
        if (!self::exists($role)) {
            return null;
        }

        return [
            'value' => $role,
            ...self::ROLES[$role],
        ];
    }

    public static function requiresRelatedEntity(string $role): bool
    {
        return in_array(self::ROLES[$role]['record_type'] ?? 'profile_only', ['teacher', 'student', 'guardian'], true);
    }

    public static function entityTableForDni(string $role): ?string
    {
        return self::ROLES[$role]['entity_table'] ?? null;
    }
}
