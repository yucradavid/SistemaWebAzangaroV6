<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Models\AcademicYear;
use App\Models\Guardian;
use App\Models\Profile;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as RoutingController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AuthController extends RoutingController
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $normalizedEmail = strtolower(trim((string) $credentials['email']));

        $user = User::query()
            ->whereRaw('lower(email) = ?', [$normalizedEmail])
            ->first();

        if (!$user) {
            $user = $this->syncUserFromAuthSchema($normalizedEmail, (string) $credentials['password']);
        }

        $hashMatches = $user
            ? $this->passwordMatches((string) $credentials['password'], (string) $user->password)
            : false;

        Log::info('AuthController@login attempt', [
            'email' => $normalizedEmail,
            'user_found' => (bool) $user,
            'user_id' => $user?->id,
            'hash_matches' => $hashMatches,
        ]);

        if (!$user || !$hashMatches) {
            return response()->json([
                'message' => 'Credenciales incorrectas.'
            ], 401);
        }

        $profile = Profile::query()
            ->where('user_id', (string) $user->id)
            ->first();

        if (!$profile) {
            $profile = Profile::query()
                ->whereNull('user_id')
                ->whereRaw('lower(email) = ?', [$normalizedEmail])
                ->first();
        }

        if ($profile && !$profile->user_id) {
            $profile->update(['user_id' => (string) $user->id]);
        }

        if (!$profile) {
            $profile = Profile::create([
                'id' => (string) $user->id,
                'user_id' => (string) $user->id,
                'role' => 'admin',
                'full_name' => $user->name ?? 'Sin nombre',
                'email' => $user->email,
                'is_active' => true,
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->fresh()->load('profile'),
        ]);
    }

    private function syncUserFromAuthSchema(string $normalizedEmail, string $plainPassword): ?User
    {
        $authUser = DB::table('auth.users')
            ->select(['id', 'email', 'encrypted_password', 'created_at', 'updated_at'])
            ->whereRaw('lower(email) = ?', [$normalizedEmail])
            ->first();

        if (!$authUser || empty($authUser->encrypted_password)) {
            return null;
        }

        $normalizedAuthHash = $this->normalizeLegacyBcryptHash((string) $authUser->encrypted_password);

        if (!$this->passwordMatches($plainPassword, (string) $authUser->encrypted_password)) {
            Log::info('AuthController@login auth.users fallback password mismatch', [
                'email' => $normalizedEmail,
                'auth_user_id' => $authUser->id ?? null,
            ]);

            return null;
        }

        $profile = Profile::query()
            ->where(function ($query) use ($authUser, $normalizedEmail) {
                $query->where('user_id', (string) $authUser->id)
                    ->orWhereRaw('lower(email) = ?', [$normalizedEmail]);
            })
            ->orderByRaw("CASE WHEN user_id = ? THEN 0 ELSE 1 END", [(string) $authUser->id])
            ->first();

        $teacher = Teacher::query()
            ->where(function ($query) use ($authUser, $normalizedEmail) {
                $query->where('user_id', (string) $authUser->id)
                    ->orWhereRaw('lower(email) = ?', [$normalizedEmail]);
            })
            ->first();

        $resolvedName = $profile?->full_name
            ?: trim(implode(' ', array_filter([
                $teacher?->first_name,
                $teacher?->last_name,
            ])))
            ?: strtok((string) $authUser->email, '@')
            ?: 'Usuario';

        DB::table('users')->updateOrInsert(
            ['id' => (string) $authUser->id],
            [
                'name' => $resolvedName,
                'email' => strtolower((string) $authUser->email),
                'password' => $normalizedAuthHash,
                'created_at' => $authUser->created_at ?? now(),
                'updated_at' => now(),
            ]
        );

        Log::info('AuthController@login synced auth.users into public.users', [
            'email' => $normalizedEmail,
            'user_id' => (string) $authUser->id,
        ]);

        return User::query()->find((string) $authUser->id);
    }

    private function passwordMatches(string $plainPassword, ?string $hashedPassword): bool
    {
        if (!$hashedPassword) {
            return false;
        }

        try {
            return Hash::check($plainPassword, $hashedPassword);
        } catch (RuntimeException $exception) {
            $normalizedHash = $this->normalizeLegacyBcryptHash($hashedPassword);

            if ($normalizedHash === $hashedPassword) {
                throw $exception;
            }

            return password_verify($plainPassword, $normalizedHash);
        }
    }

    private function normalizeLegacyBcryptHash(string $hashedPassword): string
    {
        if (str_starts_with($hashedPassword, '$2a$')) {
            return '$2y$' . substr($hashedPassword, 4);
        }

        return $hashedPassword;
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()?->load('profile')
        ]);
    }

    public function academicContext(Request $request)
    {
        $user = $request->user()?->load('profile');
        $role = $user?->profile?->role;
        $activeAcademicYear = AcademicYear::query()
            ->where('is_active', true)
            ->orderByDesc('year')
            ->first();

        $students = collect();

        if ($user && $role === 'student') {
            $students = Student::query()
                ->with(['section.gradeLevel'])
                ->where('user_id', $user->id)
                ->get();
        }

        if ($user && $role === 'guardian') {
            $guardian = Guardian::query()
                ->where('user_id', $user->id)
                ->first();

            if ($guardian) {
                $students = $guardian->students()
                    ->with(['section.gradeLevel'])
                    ->orderBy('last_name')
                    ->orderBy('first_name')
                    ->get();
            }
        }

        return response()->json([
            'user' => $user,
            'role' => $role,
            'active_academic_year' => $activeAcademicYear ? [
                'id' => $activeAcademicYear->id,
                'year' => $activeAcademicYear->year,
                'start_date' => $activeAcademicYear->start_date,
                'end_date' => $activeAcademicYear->end_date,
                'is_active' => $activeAcademicYear->is_active,
            ] : null,
            'students' => $students->map(function (Student $student) {
                return [
                    'id' => $student->id,
                    'student_code' => $student->student_code,
                    'full_name' => $student->full_name,
                    'section_id' => $student->section_id,
                    'section' => $student->section ? [
                        'id' => $student->section->id,
                        'section_letter' => $student->section->section_letter,
                        'grade_level' => $student->section->gradeLevel ? [
                            'id' => $student->section->gradeLevel->id,
                            'name' => $student->section->gradeLevel->name,
                            'level' => $student->section->gradeLevel->level,
                            'grade' => $student->section->gradeLevel->grade,
                        ] : null,
                    ] : null,
                ];
            })->values(),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesión cerrada.'
        ]);
    }
}
