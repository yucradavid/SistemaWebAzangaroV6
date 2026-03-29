<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\Profile;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class AccountProvisioningService
{
    public function provisionStudent(Student $student): array
    {
        $fullName = trim($student->full_name);
        $email = $this->buildStudentEmail($student);

        $account = $this->provisionAccount([
            'full_name' => $fullName !== '' ? $fullName : 'Estudiante',
            'email' => $email,
            'role' => 'student',
            'dni' => $student->dni,
            'preferred_password' => $this->buildInitialPassword($student->dni),
        ]);

        if ((string) $student->user_id !== (string) $account['user_id']) {
            $student->update(['user_id' => $account['user_id']]);
        }

        return [
            'email' => $account['email'],
            'password' => $account['password'],
            'generated' => $account['generated'],
            'user_id' => $account['user_id'],
        ];
    }

    public function provisionGuardian(Guardian $guardian): array
    {
        $fullName = trim(implode(' ', array_filter([$guardian->first_name, $guardian->last_name])));
        $email = $this->buildGuardianEmail($guardian);

        $account = $this->provisionAccount([
            'full_name' => $fullName !== '' ? $fullName : 'Apoderado',
            'email' => $email,
            'role' => 'guardian',
            'dni' => $guardian->dni,
            'phone' => $guardian->phone,
            'preferred_password' => $this->buildInitialPassword($guardian->dni),
        ]);

        $guardianUpdates = [];
        if ((string) $guardian->user_id !== (string) $account['user_id']) {
            $guardianUpdates['user_id'] = $account['user_id'];
        }
        if (! $guardian->email) {
            $guardianUpdates['email'] = $account['email'];
        }

        if ($guardianUpdates !== []) {
            $guardian->update($guardianUpdates);
        }

        return [
            'email' => $account['email'],
            'password' => $account['password'],
            'generated' => $account['generated'],
            'user_id' => $account['user_id'],
        ];
    }

    private function provisionAccount(array $data): array
    {
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        if ($email === '') {
            throw new RuntimeException('No se pudo determinar un correo para la cuenta.');
        }

        $publicUser = User::query()
            ->whereRaw('lower(email) = ?', [$email])
            ->first();

        $authUser = DB::table('auth.users')
            ->select(['id', 'email', 'encrypted_password'])
            ->whereRaw('lower(email) = ?', [$email])
            ->first();

        if ($publicUser && $authUser && (string) $publicUser->id !== (string) $authUser->id) {
            throw new RuntimeException("Existe un conflicto de cuentas para el correo {$email}.");
        }

        $userId = (string) ($publicUser?->id ?? $authUser?->id ?? Str::uuid());
        $generated = ! $publicUser && ! $authUser;
        $plainPassword = $generated ? (string) ($data['preferred_password'] ?? Str::password(12)) : null;
        $hashedPassword = $generated
            ? Hash::make($plainPassword)
            : (string) ($publicUser?->password ?: $authUser?->encrypted_password);

        if (! $authUser) {
            DB::table('auth.users')->insert([
                'instance_id' => '00000000-0000-0000-0000-000000000000',
                'id' => $userId,
                'aud' => 'authenticated',
                'role' => 'authenticated',
                'email' => $email,
                'encrypted_password' => $hashedPassword,
                'email_confirmed_at' => now(),
                'raw_app_meta_data' => json_encode([
                    'provider' => 'email',
                    'providers' => ['email'],
                ], JSON_UNESCAPED_UNICODE),
                'raw_user_meta_data' => json_encode([
                    'sub' => $userId,
                    'role' => $data['role'],
                    'email' => $email,
                    'full_name' => $data['full_name'],
                    'email_verified' => true,
                    'phone_verified' => false,
                ], JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
                'is_sso_user' => false,
                'is_anonymous' => false,
            ]);
        }

        DB::table('users')->updateOrInsert(
            ['id' => $userId],
            [
                'name' => Str::of((string) $data['full_name'])->before(' ')->value() ?: $data['full_name'],
                'email' => $email,
                'password' => $hashedPassword,
                'created_at' => $publicUser?->created_at ?? now(),
                'updated_at' => now(),
            ]
        );

        $profile = Profile::query()
            ->where('user_id', $userId)
            ->orWhereRaw('lower(email) = ?', [$email])
            ->when(! empty($data['dni']), function ($query) use ($data) {
                $query->orWhere('dni', $data['dni']);
            })
            ->first();

        if (! $profile) {
            Profile::create([
                'id' => $userId,
                'user_id' => $userId,
                'role' => $data['role'],
                'full_name' => $data['full_name'],
                'dni' => $data['dni'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $email,
                'is_active' => true,
            ]);
        } else {
            $profile->update([
                'user_id' => $profile->user_id ?: $userId,
                'role' => $profile->role ?: $data['role'],
                'full_name' => $profile->full_name ?: $data['full_name'],
                'dni' => $profile->dni ?: ($data['dni'] ?? null),
                'phone' => $profile->phone ?: ($data['phone'] ?? null),
                'email' => $profile->email ?: $email,
                'is_active' => $profile->is_active ?? true,
            ]);
        }

        return [
            'user_id' => $userId,
            'email' => $email,
            'password' => $plainPassword,
            'generated' => $generated,
        ];
    }

    private function buildStudentEmail(Student $student): string
    {
        if ($student->user_id) {
            $profileEmail = Profile::query()->where('user_id', (string) $student->user_id)->value('email');
            if ($profileEmail) {
                return strtolower((string) $profileEmail);
            }
        }

        $firstName = $this->sanitizeAliasPart((string) $student->first_name);
        $lastName = $this->sanitizeAliasPart((string) $student->last_name);

        $baseAlias = collect([$firstName, $lastName])
            ->filter()
            ->join('.');

        if ($baseAlias === '') {
            $baseAlias = $this->sanitizeAliasPart((string) $student->student_code) ?: 'estudiante';
        }

        return $this->buildUniqueInstitutionalEmail(
            $baseAlias,
            [
                $this->sanitizeAliasPart((string) $student->student_code),
                substr(preg_replace('/\D+/', '', (string) $student->dni), -4),
            ]
        );
    }

    private function buildGuardianEmail(Guardian $guardian): string
    {
        if ($guardian->email) {
            return strtolower(trim((string) $guardian->email));
        }

        $firstName = $this->sanitizeAliasPart((string) $guardian->first_name);
        $lastName = $this->sanitizeAliasPart((string) $guardian->last_name);
        $baseAlias = collect([$firstName, $lastName])
            ->filter()
            ->join('.');

        if ($baseAlias === '') {
            $digits = preg_replace('/\D+/', '', (string) $guardian->dni);
            $baseAlias = $digits !== '' ? "familia.{$digits}" : 'familia';
        }

        return $this->buildUniqueInstitutionalEmail(
            $baseAlias,
            [
                substr(preg_replace('/\D+/', '', (string) $guardian->dni), -4),
            ]
        );
    }

    private function buildInitialPassword(?string $dni): string
    {
        $digits = preg_replace('/\D+/', '', (string) $dni);
        $suffix = $digits !== '' ? $digits : strtoupper(Str::random(6));

        return "Cermat{$suffix}";
    }

    private function institutionalDomain(): string
    {
        return trim((string) env('INSTITUTIONAL_EMAIL_DOMAIN', 'cermatschool.edu.pe'));
    }

    private function sanitizeAliasPart(string $value): string
    {
        $clean = Str::of(Str::ascii($value))
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '.')
            ->trim('.')
            ->value();

        return explode('.', $clean)[0] ?? '';
    }

    private function buildUniqueInstitutionalEmail(string $baseAlias, array $fallbackSuffixes = []): string
    {
        $alias = trim($baseAlias, '.');
        if ($alias === '') {
            $alias = 'usuario';
        }

        $candidates = [$alias];

        foreach ($fallbackSuffixes as $suffix) {
            $cleanSuffix = trim((string) $suffix, '.');
            if ($cleanSuffix !== '') {
                $candidates[] = "{$alias}.{$cleanSuffix}";
            }
        }

        foreach ($candidates as $candidate) {
            $email = strtolower($candidate . '@' . $this->institutionalDomain());
            if (! $this->emailExists($email)) {
                return $email;
            }
        }

        return strtolower($alias . '.' . strtolower(Str::random(4)) . '@' . $this->institutionalDomain());
    }

    private function emailExists(string $email): bool
    {
        return User::query()->whereRaw('lower(email) = ?', [$email])->exists()
            || DB::table('auth.users')->whereRaw('lower(email) = ?', [$email])->exists();
    }
}
