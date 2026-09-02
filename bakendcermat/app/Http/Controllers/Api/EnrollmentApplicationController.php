<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InstallmentSplitException;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Discount;
use App\Models\DocumentType;
use App\Models\EnrollmentApplication;
use App\Models\EnrollmentApplicationDocument;
use App\Models\GradeLevel;
use App\Models\Guardian;
use App\Models\Profile;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use App\Services\AccountProvisioningService;
use App\Services\ChargeIssuanceService;
use App\Services\EnrollmentBillingService;
use App\Services\InstallmentPlanCalculator;
use App\Support\EnrollmentApplicationValueNormalizer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use RuntimeException;

class EnrollmentApplicationController extends Controller
{
    public function __construct(
        private readonly AccountProvisioningService $accountProvisioningService,
        private readonly EnrollmentBillingService $billing,
        private readonly ChargeIssuanceService $chargeIssuance,
        private readonly InstallmentPlanCalculator $calculator
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

    // GET /api/public/reniec-lookup?dni=########
    // Endpoint público para verificar si un DNI existe realmente en Reniec.
    public function reniecLookup(Request $request): JsonResponse
    {
        $dni = trim((string) $request->query('dni', ''));

        if (! preg_match('/^[0-9]{8}$/', $dni)) {
            return response()->json([
                'success' => false,
                'message' => 'El DNI debe tener exactamente 8 dígitos.',
            ], 422);
        }

        $baseUrl = env('RENIEC_BASE_URL');
        $token = env('RENIEC_TOKEN');
        $clientId = env('RENIEC_CLIENT_ID');
        $clientSecret = env('RENIEC_CLIENT_SECRET');
        $apiKey = env('RENIEC_API_KEY');

        if (! $baseUrl || (! $token && ! $apiKey && (! $clientId || ! $clientSecret))) {
            return response()->json([
                'success' => false,
                'message' => 'La validación con Reniec no está configurada en el backend.',
            ], 503);
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
                ->when($token, function ($http, $tokenValue) {
                    return $http->withToken($tokenValue);
                }, $token)
                ->when($clientId && $clientSecret, function ($http) use ($clientId, $clientSecret) {
                    return $http->withBasicAuth($clientId, $clientSecret);
                })
                ->when($apiKey, function ($http, $apiKeyValue) {
                    return $http->withHeaders(['X-API-Key' => $apiKeyValue]);
                }, $apiKey)
                ->get(rtrim($baseUrl, '/').'/consulta-dni', ['dni' => $dni]);

            if (! $response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El DNI no pudo ser verificado con Reniec.',
                ], 502);
            }

            $payload = $response->json();
            $data = $payload['data'] ?? $payload;

            $nombres = trim((string) ($data['nombres'] ?? $data['name'] ?? ''));
            $apellidoPaterno = trim((string) ($data['apellido_paterno'] ?? $data['last_name'] ?? ''));
            $apellidoMaterno = trim((string) ($data['apellido_materno'] ?? $data['mothers_last_name'] ?? ''));
            $fechaNacimiento = trim((string) ($data['fecha_nacimiento'] ?? $data['birth_date'] ?? ''));
            $sexo = strtoupper(trim((string) ($data['sexo'] ?? $data['gender'] ?? '')));

            return response()->json([
                'success' => true,
                'data' => [
                    'dni' => $dni,
                    'nombres' => $nombres,
                    'apellido_paterno' => $apellidoPaterno,
                    'apellido_materno' => $apellidoMaterno,
                    'fecha_nacimiento' => $fechaNacimiento,
                    'sexo' => $sexo,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar Reniec: '.$e->getMessage(),
            ], 500);
        }
    }

    // GET /api/public/guardian-lookup?dni=########
    // Endpoint PÚBLICO (sin auth) para autocompletar datos del apoderado
    // y detectar hermanos ya matriculados en el sistema.
    public function guardianLookup(Request $request): JsonResponse
    {
        $dni = trim((string) $request->query('dni', ''));

        if (strlen($dni) < 7) {
            return response()->json(['found' => false]);
        }

        $guardian = Guardian::query()
            ->where('dni', $dni)
            ->with(['students' => function ($q) {
                $q->select('students.id', 'students.first_name', 'students.last_name', 'students.student_code');
            }])
            ->first();

        if (! $guardian) {
            return response()->json(['found' => false]);
        }

        $siblings = $this->mapSiblings($guardian);

        // Solo se devuelven datos necesarios para autocompletar.
        // No se exponen IDs internos del apoderado ni de los estudiantes.
        return response()->json([
            'found' => true,
            'first_name' => $guardian->first_name,
            'last_name' => $guardian->last_name,
            'phone' => $guardian->phone,
            'email' => $guardian->email,
            'address' => $guardian->address,
            'relationship' => $guardian->relationship,
            'siblings_count' => $siblings->count(),
            'siblings' => $siblings,
        ]);
    }

    // Mapea los estudiantes de un apoderado a {name, code} sin exponer IDs.
    private function mapSiblings(Guardian $guardian)
    {
        return $guardian->students->map(function ($student) {
            $name = trim(($student->first_name ?? '').' '.($student->last_name ?? ''));

            return [
                'name' => $name !== '' ? $name : 'Estudiante',
                'code' => $student->student_code,
            ];
        })->values();
    }

    // Calcula los hermanos detectados para el apoderado de una solicitud,
    // buscando por el DNI registrado en la pre matricula.
    private function siblingsForApplication(EnrollmentApplication $app)
    {
        $guardian = Guardian::query()
            ->where('dni', $app->guardian_document_number)
            ->with(['students' => function ($q) {
                $q->select('students.id', 'students.first_name', 'students.last_name', 'students.student_code');
            }])
            ->first();

        if (! $guardian) {
            return collect([]);
        }

        return $this->mapSiblings($guardian);
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
            'data' => $app,
        ], 201);
    }

    // GET /api/enrollment-applications/{id}
    public function show(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        $siblings = $this->siblingsForApplication($app);

        // Se adjuntan los hermanos detectados al detalle sin alterar el flujo.
        $payload = $app->toArray();
        $payload['siblings_detected'] = $siblings;
        $payload['siblings_count'] = $siblings->count();

        return response()->json($payload);
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
            'data' => $app,
        ]);
    }

    // DELETE /api/enrollment-applications/{id}
    public function destroy(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);
        $app->delete();

        return response()->json([
            'message' => 'Solicitud eliminada',
        ]);
    }

    // =========================
    // ACTIONS
    // =========================

    // POST /api/enrollment-applications/{id}/approve
    public function approve(Request $request, string $id)
    {
        $app = EnrollmentApplication::with('gradeLevel')->findOrFail($id);

        if ($app->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden aprobar solicitudes en estado pending.',
            ], 422);
        }

        $requiredDocIds = DocumentType::query()
            ->where('is_required', true)
            ->where('is_active', true)
            ->where('level', $app->gradeLevel?->level)
            ->pluck('id');

        $deliveredDocIds = EnrollmentApplicationDocument::query()
            ->where('enrollment_application_id', $app->id)
            ->where('delivered', true)
            ->pluck('document_type_id');

        $missing = $requiredDocIds->diff($deliveredDocIds);

        if ($missing->isNotEmpty()) {
            return response()->json([
                'message' => 'No se puede aprobar: faltan documentos obligatorios por marcar como entregados.',
                'missing_count' => $missing->count(),
            ], 422);
        }

        $data = $request->validate([
            'section_id' => ['required', 'uuid', 'exists:sections,id'],
            'payment_mode' => ['required', Rule::in(['contado', 'cuotas'])],
            'installments_count' => ['nullable', 'integer', 'required_if:payment_mode,cuotas'],
        ]);

        $section = Section::query()->findOrFail($data['section_id']);

        if (
            $section->academic_year_id !== $app->academic_year_id
            || $section->grade_level_id !== $app->grade_level_id
        ) {
            return response()->json([
                'message' => 'La seccion seleccionada no pertenece al mismo ano academico y grado de la solicitud.',
            ], 422);
        }

        // La modalidad se valida ANTES de llamar a la funcion SQL: esa funcion
        // hace su propio commit, asi que si la eleccion fuera imposible (p. ej.
        // 8 cuotas cuando solo caben 4 en lo que resta del anio) la matricula
        // quedaria aprobada y sin cargos. Fallar aqui la deja intacta.
        $approvedAt = Carbon::now();
        $academicYear = (int) AcademicYear::query()->where('id', $app->academic_year_id)->value('year');
        $installmentsCount = $data['payment_mode'] === 'cuotas'
            ? (int) $data['installments_count']
            : null;

        $this->billing->validateSelection(
            $data['payment_mode'],
            $installmentsCount,
            $approvedAt,
            $academicYear
        );

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
            'SELECT * FROM public.approve_enrollment_application(?, ?, ?)',
            [$id, $data['section_id'], $profileId]
        );

        if (! $result) {
            return response()->json([
                'message' => 'No se pudo aprobar la solicitud (la funcion SQL no retorno respuesta).',
            ], 500);
        }

        if (property_exists($result, 'success') && ! $result->success) {
            return response()->json([
                'message' => $result->message ?? 'No se pudo aprobar la solicitud.',
            ], 422);
        }

        // refrescar estado por si la funcion lo actualizo
        $app->refresh();

        $studentId = property_exists($result, 'student_id') ? (string) $result->student_id : null;

        // Persistir la decision en la solicitud: sin esto, el vinculo
        // solicitud -> alumno solo existia en el retorno de la funcion SQL y se
        // perdia, y la vista de "contado aprobado sin cobrar" tendria que unir
        // por DNI.
        $app->forceFill([
            'student_id' => $studentId,
            'payment_mode' => $data['payment_mode'],
            'installments_count' => $installmentsCount,
        ])->save();

        // Generacion de cargos, en su propia transaccion. approve() no abre una
        // transaccion que envuelva todo, asi que la llamada a la funcion SQL ya
        // quedo confirmada por autocommit de sentencia: no se puede "deshacer"
        // la matricula desde aqui. Por eso, si la generacion de cargos falla, se
        // reporta y se deja la matricula aprobada; los cargos se emiten despues
        // desde Finanzas -> Emision Masiva, en vez de dejar al alumno a medio
        // crear. La eleccion de modalidad ya se valido mas arriba, justamente
        // para que este camino sea raro.
        $billing = null;
        $billingError = null;

        if ($studentId) {
            try {
                $student = Student::query()->findOrFail($studentId);

                $billing = DB::transaction(fn () => $this->billing->generateForApproval(
                    $student,
                    $app->academic_year_id,
                    $academicYear,
                    $data['payment_mode'],
                    $installmentsCount,
                    $this->chargeIssuance->resolveActorUserId($user),
                    $approvedAt
                ));
            } catch (\Throwable $exception) {
                report($exception);
                $billingError = $exception->getMessage();
            }
        }

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
                ? (($result->message ?? 'Solicitud aprobada').' La matricula se registro, pero hubo un problema al generar las credenciales.')
                : ($result->message ?? 'Solicitud aprobada'),
            'data' => [
                'result' => $result,
                'application' => $app,
                'credentials' => $credentials,
                'credentials_error' => $credentialsError,
                // Con esto el frontend puede mostrar el resumen y mandar a
                // Finanzas -> Cuenta Corriente a cobrar.
                'billing' => $billing,
                'billing_error' => $billingError,
                'student_id' => $studentId,
            ],
        ]);
    }

    /**
     * GET /api/enrollment-applications/{id}/billing-preview
     *
     * Solo LECTURA: no crea cargos ni toca la solicitud. Devuelve, para la
     * misma solicitud que se esta por aprobar, cuanto se le va a cobrar en
     * cada modalidad disponible, para que el modal de aprobacion lo muestre
     * ANTES de confirmar.
     *
     * El calculo NO se replica en el frontend a proposito: reusa exactamente
     * los mismos servicios que despues generan los cargos de verdad
     * (EnrollmentBillingService + InstallmentPlanCalculator + la regla de
     * Discount::appliesTo), asi la vista previa no puede divergir del cobro
     * real por un redondeo o por un dia de vencimiento distinto. Ademas es la
     * unica forma de que el frontend conozca installment_options,
     * pension_due_day y pension_first_due_month, que viven en system_settings
     * y no estan expuestos por ningun otro endpoint.
     */
    public function billingPreview(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        $referenceDate = Carbon::now();
        $academicYear = (int) AcademicYear::query()->where('id', $app->academic_year_id)->value('year');

        $installmentOptions = $this->billing->installmentOptions();

        $payload = [
            'academic_year_id' => $app->academic_year_id,
            'academic_year' => $academicYear,
            'reference_date' => $referenceDate->toDateString(),
            'installment_options' => $installmentOptions,
            'max_installments' => $this->billing->maxInstallmentsThatFit($referenceDate, $academicYear),
            'first_scheduled_due_date' => $this->billing->firstScheduledDueDate($referenceDate, $academicYear)->toDateString(),
        ];

        // Sin conceptos activos bien configurados no hay nada que previsualizar,
        // pero tampoco es un error del usuario: se devuelve 200 con el motivo
        // para que el modal lo muestre y bloquee el boton, en vez de un 500.
        try {
            $matricula = $this->billing->resolveConcept('matricula');
            $pension = $this->billing->resolveConcept('pension');
        } catch (InstallmentSplitException $exception) {
            return response()->json($payload + [
                'concepts_error' => $exception->getMessage(),
                'concepts' => null,
                'auto_discount' => null,
                'options' => [],
            ]);
        }

        $discount = Discount::autoApplyForYear($app->academic_year_id, 'contado');

        $payload['concepts_error'] = null;
        $payload['concepts'] = [
            'matricula' => ['name' => $matricula->name, 'amount' => round((float) $matricula->base_amount, 2)],
            'pension' => ['name' => $pension->name, 'amount' => round((float) $pension->base_amount, 2)],
        ];
        $payload['auto_discount'] = $discount ? [
            'id' => $discount->id,
            'name' => $discount->name,
            'type' => $discount->type,
            'value' => (float) $discount->value,
            'concepts' => $discount->feeConcepts->pluck('name')->values()->all(),
        ] : null;

        // CONTADO: matricula + pension anual completa, ambas venciendo hoy, y
        // el descuento automatico de contado si el admin lo configuro.
        $options = [
            $this->buildPreviewOption('contado', 'contado', null, true, null, [
                [
                    'label' => 'Matricula',
                    'type' => 'matricula',
                    'concept_id' => $matricula->id,
                    'due_date' => $referenceDate->toDateString(),
                    'amount' => round((float) $matricula->base_amount, 2),
                ],
                [
                    'label' => 'Pension anual completa',
                    'type' => 'pension',
                    'concept_id' => $pension->id,
                    'due_date' => $referenceDate->toDateString(),
                    'amount' => round((float) $pension->base_amount, 2),
                ],
            ], $discount, $referenceDate),
        ];

        // CUOTAS: una entrada por cada cantidad habilitada. Las que no caben en
        // lo que resta del anio se devuelven con available=false y el mismo
        // mensaje que daria approve(), en vez de ocultarlas: asi secretaria ve
        // por que no puede elegir 8 cuotas en septiembre.
        foreach ($installmentOptions as $count) {
            try {
                $this->billing->validateSelection('cuotas', $count, $referenceDate, $academicYear);
                $montos = $this->calculator->split((float) $pension->base_amount, $count);
            } catch (InstallmentSplitException $exception) {
                $options[] = $this->buildPreviewOption(
                    'cuotas-'.$count,
                    'cuotas',
                    $count,
                    false,
                    $exception->getMessage(),
                    [],
                    null,
                    $referenceDate
                );

                continue;
            }

            $fechas = $this->billing->scheduledDueDates($referenceDate, $academicYear, $count);

            $lines = [[
                'label' => 'Matricula',
                'type' => 'matricula',
                'concept_id' => $matricula->id,
                'due_date' => $referenceDate->toDateString(),
                'amount' => round((float) $matricula->base_amount, 2),
            ]];

            foreach ($montos as $i => $monto) {
                $numero = $i + 1;
                $vence = $numero === 1 ? $referenceDate : $fechas[$i - 1];

                $lines[] = [
                    'label' => "Pension - cuota {$numero} de {$count}",
                    'type' => 'pension',
                    'concept_id' => $pension->id,
                    'due_date' => $vence->toDateString(),
                    'amount' => round($monto, 2),
                ];
            }

            // El descuento automatico es exclusivo de contado: en cuotas se
            // pasa null a proposito, igual que hace generateForApproval().
            $options[] = $this->buildPreviewOption(
                'cuotas-'.$count,
                'cuotas',
                $count,
                true,
                null,
                $lines,
                null,
                $referenceDate
            );
        }

        $payload['options'] = $options;

        return response()->json($payload);
    }

    /**
     * Arma una modalidad de la vista previa aplicando el descuento cargo por
     * cargo con la MISMA regla del recalculo real (StudentDiscountService):
     * porcentaje sobre el bruto, monto fijo sumado, tope en el monto del cargo,
     * y Discount::appliesTo() decidiendo a que cargos alcanza.
     */
    private function buildPreviewOption(
        string $key,
        string $paymentMode,
        ?int $installments,
        bool $available,
        ?string $unavailableReason,
        array $lines,
        ?Discount $discount,
        Carbon $referenceDate
    ): array {
        $charges = [];
        $gross = 0.0;
        $discountTotal = 0.0;
        $dueToday = 0.0;
        $today = $referenceDate->toDateString();

        foreach ($lines as $line) {
            $amount = (float) $line['amount'];
            $lineDiscount = 0.0;

            if ($discount && $discount->appliesTo($line['type'], $line['concept_id'])) {
                $lineDiscount = $discount->type === 'porcentaje'
                    ? round($amount * (float) $discount->value / 100, 2)
                    : (float) $discount->value;

                $lineDiscount = min($amount, $lineDiscount);
            }

            $final = round($amount - $lineDiscount, 2);
            $gross += $amount;
            $discountTotal += $lineDiscount;

            if ($line['due_date'] <= $today) {
                $dueToday += $final;
            }

            $charges[] = [
                'label' => $line['label'],
                'type' => $line['type'],
                'due_date' => $line['due_date'],
                'amount' => round($amount, 2),
                'discount_amount' => round($lineDiscount, 2),
                'final_amount' => $final,
            ];
        }

        return [
            'key' => $key,
            'payment_mode' => $paymentMode,
            'installments_count' => $installments,
            'available' => $available,
            'unavailable_reason' => $unavailableReason,
            'charges' => $charges,
            'gross_total' => round($gross, 2),
            'discount_total' => round($discountTotal, 2),
            'total' => round($gross - $discountTotal, 2),
            'due_today' => round($dueToday, 2),
        ];
    }

    /**
     * GET /api/enrollment-applications/pending-cash-collection
     *
     * Matriculas aprobadas con pago AL CONTADO cuyos cargos todavia no fueron
     * cobrados: secretaria las aprobo, pero nadie confirmo el pago real en
     * Finanzas. Es la lista de seguimiento del punto 6 del flujo.
     *
     * "No cobrado" = tiene al menos un cargo vigente (no anulado) del anio en
     * estado pendiente o pagado_parcial. Un alumno con todo pagado desaparece
     * solo de la lista, sin necesidad de marcarlo a mano.
     */
    public function pendingCashCollection(Request $request)
    {
        $academicYearId = $request->input('academic_year_id')
            ?? AcademicYear::query()->where('is_active', true)->value('id');

        $applications = EnrollmentApplication::query()
            ->with(['gradeLevel', 'student.section.gradeLevel'])
            ->where('status', 'approved')
            ->where('payment_mode', 'contado')
            ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
            ->whereNotNull('student_id')
            ->whereHas('student.charges', function ($q) use ($academicYearId) {
                $q->whereNull('voided_at')
                    ->whereIn('status', ['pendiente', 'pagado_parcial'])
                    ->when($academicYearId, fn ($sub) => $sub->where('academic_year_id', $academicYearId));
            })
            ->orderByDesc('reviewed_at')
            ->get();

        $data = $applications->map(function (EnrollmentApplication $app) use ($academicYearId) {
            $charges = $app->student
                ? $app->student->charges()
                    ->whereNull('voided_at')
                    ->when($academicYearId, fn ($q) => $q->where('academic_year_id', $academicYearId))
                    ->orderBy('due_date')
                    ->get()
                : collect();

            $pendientes = $charges->whereIn('status', ['pendiente', 'pagado_parcial']);

            return [
                'application_id' => $app->id,
                'student_id' => $app->student_id,
                'student_name' => trim($app->student_first_name.' '.$app->student_last_name),
                'student_code' => $app->student?->student_code,
                'grade_level' => $app->gradeLevel?->name,
                'section' => $app->student?->section?->section_letter,
                'guardian_name' => trim($app->guardian_first_name.' '.$app->guardian_last_name),
                'guardian_phone' => $app->guardian_phone,
                'approved_at' => optional($app->reviewed_at)->toDateTimeString(),
                'charges_count' => $pendientes->count(),
                'total_due' => round((float) $pendientes->sum('final_amount') - (float) $pendientes->sum('paid_amount'), 2),
                'total_charged' => round((float) $charges->sum('final_amount'), 2),
                'total_paid' => round((float) $charges->sum('paid_amount'), 2),
            ];
        })->values();

        return response()->json([
            'academic_year_id' => $academicYearId,
            'count' => $data->count(),
            'total_due' => round((float) $data->sum('total_due'), 2),
            'data' => $data,
        ]);
    }

    // POST /api/enrollment-applications/{id}/provision-accounts
    public function provisionAccounts(string $id)
    {
        $app = EnrollmentApplication::findOrFail($id);

        if ($app->status !== 'approved') {
            return response()->json([
                'message' => 'Solo se pueden generar credenciales para solicitudes aprobadas.',
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
                'message' => 'Solo se pueden rechazar solicitudes en estado pending.',
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
            'data' => $app,
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

        $studentResult = $this->accountProvisioningService->provisionStudent($student);

        // Solo se provisiona la cuenta del apoderado si NO existe ya una
        // en public.users. Si ya tiene cuenta, no se regenera ni se duplica:
        // las credenciales se entregan unicamente al hijo.
        $guardianEmail = strtolower(trim((string) $guardian->email));
        $existingGuardianUser = $guardianEmail !== ''
            ? User::query()->whereRaw('lower(email) = ?', [$guardianEmail])->first()
            : null;

        $guardianResult = $existingGuardianUser
            ? [
                'email' => $existingGuardianUser->email,
                'password' => null,
                'generated' => false,
                'user_id' => (string) $existingGuardianUser->id,
                'message' => 'El apoderado ya tiene cuenta',
            ]
            : $this->accountProvisioningService->provisionGuardian($guardian);

        return [
            'student' => $studentResult,
            'guardian' => $guardianResult,
        ];
    }
}
