<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use App\Models\Profile;
use App\Models\EnrollmentApplication;
use App\Models\AcademicYear;
use App\Models\Guardian;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Student;
use App\Services\AccountProvisioningService;
use App\Support\EnrollmentApplicationValueNormalizer;
use Illuminate\Validation\Rule;
use RuntimeException;

class EnrollmentApplicationController extends Controller
{
    public function __construct(
        private readonly AccountProvisioningService $accountProvisioningService
    ) {}

    public function publicOptions()
    {
        return response()->json([
            'academic_years' => AcademicYear::query()
                ->orderByDesc('year')
                ->get(['id', 'year', 'is_active']),
            'grade_levels' => GradeLevel::query()
                ->orderBy('name')
                ->get(['id', 'name', 'level', 'grade']),
        ]);
    }

    // =========================
    // CRUD
    // =========================

    // GET /api/enrollment-applications
    public function index(Request $request)
    {
        $q = EnrollmentApplication::query()
            ->with(['academicYear:id,year,is_active', 'gradeLevel:id,name,level,grade']);

        if ($request->filled('status')) {
            $q->where('status', $request->string('status'));
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->string('academic_year_id'));
        }

        if ($request->filled('grade_level_id')) {
            $q->where('grade_level_id', $request->string('grade_level_id'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $q->where(function ($qq) use ($search) {
                $qq->where('student_first_name', 'ilike', "%{$search}%")
                    ->orWhere('student_last_name', 'ilike', "%{$search}%")
                    ->orWhere('student_document_number', 'ilike', "%{$search}%")
                    ->orWhere('guardian_document_number', 'ilike', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 15);

        $data = $q->orderByDesc('created_at')->paginate($perPage);

        return response()->json($data);
    }

    // POST /api/enrollment-applications
    public function store(Request $request)
    {
        $request->merge(
            EnrollmentApplicationValueNormalizer::normalizePayload($request->all())
        );

        $data = $request->validate([
            'student_first_name' => ['required', 'string'],
            'student_last_name' => ['required', 'string'],
            'student_document_type' => ['required', Rule::in(EnrollmentApplicationValueNormalizer::DOCUMENT_TYPES)],
            'student_document_number' => ['required', 'string'],
            'student_birth_date' => ['required', 'date'],
            'student_gender' => ['required', Rule::in(EnrollmentApplicationValueNormalizer::GENDERS)],

            'student_address' => ['nullable', 'string'],
            'student_photo_url' => ['nullable', 'string'],

            'guardian_first_name' => ['required', 'string'],
            'guardian_last_name' => ['required', 'string'],
            'guardian_document_type' => ['required', Rule::in(EnrollmentApplicationValueNormalizer::DOCUMENT_TYPES)],
            'guardian_document_number' => ['required', 'string'],
            'guardian_phone' => ['nullable', 'string'],
            'guardian_email' => ['nullable', 'email'],
            'guardian_address' => ['nullable', 'string'],
            'guardian_relationship' => ['nullable', Rule::in(EnrollmentApplicationValueNormalizer::RELATIONSHIPS)],

            'grade_level_id' => ['required', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],

            'previous_school' => ['nullable', 'string'],
            'has_special_needs' => ['nullable', 'boolean'],
            'special_needs_description' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string'],
            'emergency_contact_phone' => ['nullable', 'string'],

            'notes' => ['nullable', 'string'],
        ]);

        $data['status'] = 'pending';
        $data['application_date'] = now();

        $app = EnrollmentApplication::create($data);

        return response()->json([
            'message' => 'Solicitud creada',
            'data' => $app
        ], 201);
    }

    // GET /api/enrollment-applications/{id}
    public function show(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);
        return response()->json($app);
    }

    // PUT/PATCH /api/enrollment-applications/{id}
    public function update(Request $request, string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        // Solo permitir editar si esta pending
        if ($app->status !== 'pending') {
            return response()->json(['message' => 'Solo se puede editar si esta pending.'], 422);
        }

        $request->merge(
            EnrollmentApplicationValueNormalizer::normalizePayload($request->all())
        );

        $data = $request->validate([
            'student_first_name' => ['sometimes', 'string'],
            'student_last_name' => ['sometimes', 'string'],
            'student_document_type' => ['sometimes', Rule::in(EnrollmentApplicationValueNormalizer::DOCUMENT_TYPES)],
            'student_document_number' => ['sometimes', 'string'],
            'student_birth_date' => ['sometimes', 'date'],
            'student_gender' => ['sometimes', Rule::in(EnrollmentApplicationValueNormalizer::GENDERS)],

            'student_address' => ['sometimes', 'nullable', 'string'],
            'student_photo_url' => ['sometimes', 'nullable', 'string'],

            'guardian_first_name' => ['sometimes', 'string'],
            'guardian_last_name' => ['sometimes', 'string'],
            'guardian_document_type' => ['sometimes', Rule::in(EnrollmentApplicationValueNormalizer::DOCUMENT_TYPES)],
            'guardian_document_number' => ['sometimes', 'string'],
            'guardian_phone' => ['sometimes', 'nullable', 'string'],
            'guardian_email' => ['sometimes', 'nullable', 'email'],
            'guardian_address' => ['sometimes', 'nullable', 'string'],
            'guardian_relationship' => ['sometimes', 'nullable', Rule::in(EnrollmentApplicationValueNormalizer::RELATIONSHIPS)],

            'grade_level_id' => ['sometimes', 'uuid', 'exists:grade_levels,id'],
            'academic_year_id' => ['sometimes', 'uuid', 'exists:academic_years,id'],

            'previous_school' => ['sometimes', 'nullable', 'string'],
            'has_special_needs' => ['sometimes', 'boolean'],
            'special_needs_description' => ['sometimes', 'nullable', 'string'],
            'emergency_contact_name' => ['sometimes', 'nullable', 'string'],
            'emergency_contact_phone' => ['sometimes', 'nullable', 'string'],

            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $app->update($data);

        return response()->json([
            'message' => 'Solicitud actualizada',
            'data' => $app
        ]);
    }

    // DELETE /api/enrollment-applications/{id}
    public function destroy(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);
        $app->delete();

        return response()->json([
            'message' => 'Solicitud eliminada'
        ]);
    }

    // =========================
    // ACTIONS
    // =========================

    // POST /api/enrollment-applications/{id}/approve
    public function approve(Request $request, string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        if ($app->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden aprobar solicitudes en estado pending.'
            ], 422);
        }

        $data = $request->validate([
            'section_id' => ['required', 'uuid', 'exists:sections,id'],
        ]);

        $section = Section::query()->findOrFail($data['section_id']);

        if (
            $section->academic_year_id !== $app->academic_year_id
            || $section->grade_level_id !== $app->grade_level_id
        ) {
            return response()->json([
                'message' => 'La seccion seleccionada no pertenece al mismo ano academico y grado de la solicitud.'
            ], 422);
        }

        $user = $request->user();

        // use relation and create profile if missing
        $profile = $user->profile;
        if (! $profile) {
            $profile = Profile::create([
                'user_id' => $user->id,
                'role' => 'admin',
                'full_name' => $user->name ?? 'Sin nombre',
                'status' => 'active',
            ]);
        }
        $profileId = $profile->id;

        $result = DB::selectOne(
            "SELECT * FROM public.approve_enrollment_application(?, ?, ?)",
            [$id, $data['section_id'], $profileId]
        );

        if (! $result) {
            return response()->json([
                'message' => 'No se pudo aprobar la solicitud (la funcion SQL no retorno respuesta).'
            ], 500);
        }

        if (property_exists($result, 'success') && ! $result->success) {
            return response()->json([
                'message' => $result->message ?? 'No se pudo aprobar la solicitud.'
            ], 422);
        }

        // refrescar estado por si la funcion lo actualizo
        $app->refresh();

        $credentials = null;
        $credentialsError = null;

        try {
            $credentials = $this->provisionAccountsForApplication(
                $app,
                property_exists($result, 'student_id') ? (string) $result->student_id : null,
                property_exists($result, 'guardian_id') ? (string) $result->guardian_id : null
            );
        } catch (\Throwable $exception) {
            report($exception);
            $credentialsError = $exception->getMessage();
        }

        return response()->json([
            'message' => $credentialsError
                ? (($result->message ?? 'Solicitud aprobada') . ' La matricula se registro, pero hubo un problema al generar las credenciales.')
                : ($result->message ?? 'Solicitud aprobada'),
            'data' => [
                'result' => $result,
                'application' => $app,
                'credentials' => $credentials,
                'credentials_error' => $credentialsError,
            ]
        ]);
    }

    // POST /api/enrollment-applications/{id}/provision-accounts
    public function provisionAccounts(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        if ($app->status !== 'approved') {
            return response()->json([
                'message' => 'Solo se pueden generar credenciales para solicitudes aprobadas.'
            ], 422);
        }

        $credentials = $this->provisionAccountsForApplication($app);
        $app->refresh();

        return response()->json([
            'message' => 'Credenciales generadas correctamente.',
            'data' => [
                'application' => $app,
                'credentials' => $credentials,
            ],
        ]);
    }

    // POST /api/enrollment-applications/{id}/reject
    public function reject(Request $request, string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        if ($app->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden rechazar solicitudes en estado pending.'
            ], 422);
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string'],
        ]);

        $user = $request->user();

        // prefer relationship; ensure a profile exists
        $profile = $user->profile;
        if (! $profile) {
            $profile = Profile::create([
                'user_id' => $user->id,
                'role' => 'admin',
                'full_name' => $user->name ?? 'Sin nombre',
                'status' => 'active',
            ]);
        }
        $profileId = $profile->id;

        $app->update([
            'status' => 'rejected',
            'reviewed_at' => Carbon::now(),
            'reviewed_by' => $profileId,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Solicitud rechazada',
            'data' => $app
        ]);
    }

    private function provisionAccountsForApplication(
        EnrollmentApplication $app,
        ?string $studentId = null,
        ?string $guardianId = null
    ): array {
        $student = $studentId
            ? Student::query()->find($studentId)
            : null;

        if (! $student) {
            $student = Student::query()
                ->where('dni', $app->student_document_number)
                ->latest('created_at')
                ->first();
        }

        if (! $student) {
            throw new RuntimeException('La solicitud fue aprobada, pero no se encontro el alumno registrado.');
        }

        $guardian = $guardianId
            ? Guardian::query()->find($guardianId)
            : null;

        if (! $guardian) {
            $guardian = Guardian::query()
                ->where('dni', $app->guardian_document_number)
                ->latest('created_at')
                ->first();
        }

        if (! $guardian) {
            $guardian = $student->guardians()
                ->where('dni', $app->guardian_document_number)
                ->latest('guardians.created_at')
                ->first();
        }

        if (! $guardian) {
            throw new RuntimeException('La solicitud fue aprobada, pero no se encontro el apoderado registrado.');
        }

        return [
            'student' => $this->accountProvisioningService->provisionStudent($student),
            'guardian' => $this->accountProvisioningService->provisionGuardian($guardian),
        ];
    }
}
