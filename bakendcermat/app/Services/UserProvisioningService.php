<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentGuardian;
use App\Models\Teacher;
use App\Models\User;
use App\Support\UserRoleCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserProvisioningService
{
    public function create(array $validated, ?string $actorUserId = null): array
    {
        return DB::transaction(function () use ($validated, $actorUserId) {
            [$firstName, $lastName] = $this->splitName((string) $validated['name']);
            $profileCreatorId = $this->resolveProfileCreatorId($actorUserId);

            $user = User::create([
                'id' => Str::uuid(),
                'name' => $firstName,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(),
            ]);

            $profile = Profile::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'role' => $validated['role'],
                'full_name' => $validated['name'],
                'dni' => $validated['dni'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'is_active' => true,
                'created_by' => $profileCreatorId,
            ]);

            $createdEntity = $this->createRoleRecord($validated['role'], $user->id, $validated, $firstName, $lastName);
            $createdRelation = $this->createStudentGuardianLinkIfNeeded($validated['role'], $createdEntity, $validated);

            return [
                'user' => $user->load('profile'),
                'profile' => $profile,
                'created_entity' => $createdEntity,
                'created_relation' => $createdRelation,
            ];
        });
    }

    private function createRoleRecord(string $role, string $userId, array $validated, string $firstName, string $lastName): ?array
    {
        if (!UserRoleCatalog::requiresRelatedEntity($role)) {
            return null;
        }

        return match ($role) {
            'teacher' => [
                'type' => 'teacher',
                'data' => Teacher::create([
                    'id' => Str::uuid(),
                    'user_id' => $userId,
                    'teacher_code' => $this->generateTeacherCode(),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'dni' => $validated['dni'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'],
                    'specialization' => $validated['specialization'] ?? null,
                    'hire_date' => $validated['hire_date'] ?? now()->toDateString(),
                    'status' => $validated['status'] ?? 'active',
                ]),
            ],
            'student' => [
                'type' => 'student',
                'data' => Student::create([
                    'id' => Str::uuid(),
                    'user_id' => $userId,
                    'student_code' => $this->generateStudentCode(),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'dni' => $validated['dni'] ?? null,
                    'birth_date' => $validated['birth_date'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'section_id' => $validated['section_id'] ?? null,
                    'enrollment_date' => $validated['enrollment_date'] ?? now()->toDateString(),
                    'status' => $validated['status'] ?? 'active',
                ]),
            ],
            'guardian' => [
                'type' => 'guardian',
                'data' => Guardian::create([
                    'id' => Str::uuid(),
                    'user_id' => $userId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'dni' => $validated['dni'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'],
                    'address' => $validated['address'] ?? null,
                    'relationship' => $validated['relationship'] ?? null,
                    'is_primary' => (bool) ($validated['is_primary'] ?? false),
                ]),
            ],
            default => null,
        };
    }

    private function createStudentGuardianLinkIfNeeded(string $role, ?array $createdEntity, array $validated): ?array
    {
        if (!$createdEntity || !isset($createdEntity['data'])) {
            return null;
        }

        if ($role === 'student' && !empty($validated['related_guardian_id'])) {
            $link = StudentGuardian::query()->firstOrCreate(
                [
                    'student_id' => $createdEntity['data']->id,
                    'guardian_id' => $validated['related_guardian_id'],
                ],
                [
                    'is_primary' => (bool) ($validated['relationship_is_primary'] ?? false),
                    'created_at' => now(),
                ]
            );

            return ['type' => 'student_guardian', 'data' => $link];
        }

        if ($role === 'guardian' && !empty($validated['related_student_id'])) {
            $link = StudentGuardian::query()->firstOrCreate(
                [
                    'student_id' => $validated['related_student_id'],
                    'guardian_id' => $createdEntity['data']->id,
                ],
                [
                    'is_primary' => (bool) ($validated['relationship_is_primary'] ?? false),
                    'created_at' => now(),
                ]
            );

            return ['type' => 'student_guardian', 'data' => $link];
        }

        return null;
    }

    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';

        return [$firstName, $lastName];
    }

    private function resolveProfileCreatorId(?string $actorUserId): ?string
    {
        $actorId = (string) ($actorUserId ?? '');

        if ($actorId === '') {
            return null;
        }

        return DB::table('auth.users')->where('id', $actorId)->exists() ? $actorId : null;
    }

    private function generateTeacherCode(): string
    {
        return $this->generateSequentialCode(Teacher::class, 'teacher_code', 'T', 3);
    }

    private function generateStudentCode(): string
    {
        return $this->generateSequentialCode(Student::class, 'student_code', 'EST', 6);
    }

    private function generateSequentialCode(string $modelClass, string $column, string $prefix, int $pad): string
    {
        $maxNumber = $modelClass::query()
            ->get([$column])
            ->map(function ($row) use ($column) {
                if (!preg_match('/(\d+)$/', (string) $row->{$column}, $matches)) {
                    return 0;
                }

                return (int) $matches[1];
            })
            ->max() ?? 0;

        return $prefix . str_pad((string) ($maxNumber + 1), $pad, '0', STR_PAD_LEFT);
    }
}
