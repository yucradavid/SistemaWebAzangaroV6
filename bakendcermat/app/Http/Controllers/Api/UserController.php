<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Profile;
use App\Models\Student;
use App\Models\StudentGuardian;
use App\Models\Teacher;
use App\Models\User;
use App\Services\UserProvisioningService;
use App\Support\UserRoleCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(
        private readonly UserProvisioningService $userProvisioningService
    ) {
    }

    public function index(Request $request)
    {
        $role = $request->query('role');

        $query = User::with('profile');

        if ($role) {
            $query->whereHas('profile', function ($profileQuery) use ($role) {
                $profileQuery->where('role', $role);
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $role = (string) $request->input('role');
        $dniUniqueTable = UserRoleCatalog::entityTableForDni($role);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(UserRoleCatalog::values())],
            'dni' => array_values(array_filter([
                'nullable',
                'string',
                'max:20',
                $dniUniqueTable ? Rule::unique($dniUniqueTable, 'dni') : null,
            ])),
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'section_id' => ['nullable', 'uuid', 'exists:sections,id'],
            'enrollment_date' => ['nullable', 'date'],
            'relationship' => ['nullable', 'string', 'max:100'],
            'is_primary' => ['nullable', 'boolean'],
            'related_guardian_id' => ['nullable', 'uuid', 'exists:guardians,id'],
            'related_student_id' => ['nullable', 'uuid', 'exists:students,id'],
            'relationship_is_primary' => ['nullable', 'boolean'],
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $result = $this->userProvisioningService->create($validated, (string) ($request->user()?->id ?? ''));

                return response()->json([
                    'message' => 'Usuario creado exitosamente',
                    'user' => $result['user'],
                    'profile' => $result['profile'],
                    'created_entity' => $result['created_entity'],
                    'created_relation' => $result['created_relation'],
                ], 201);
            });
        } catch (\Throwable $exception) {
            Log::error('UserController@store failed', [
                'email' => $request->input('email'),
                'role' => $request->input('role'),
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al crear el usuario',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        $user = User::query()->find($id);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        DB::transaction(function () use ($user) {
            $studentIds = Student::query()->where('user_id', $user->id)->pluck('id');
            $guardianIds = Guardian::query()->where('user_id', $user->id)->pluck('id');

            if ($studentIds->isNotEmpty()) {
                StudentGuardian::query()->whereIn('student_id', $studentIds)->delete();
            }

            if ($guardianIds->isNotEmpty()) {
                StudentGuardian::query()->whereIn('guardian_id', $guardianIds)->delete();
            }

            Teacher::query()->where('user_id', $user->id)->delete();
            Student::query()->where('user_id', $user->id)->delete();
            Guardian::query()->where('user_id', $user->id)->delete();
            Profile::query()->where('user_id', $user->id)->delete();
            $user->delete();
        });

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }
}
