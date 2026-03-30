<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceQrSession;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Services\DailyAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DailyAttendanceController extends Controller
{
    public function __construct(
        private readonly DailyAttendanceService $dailyAttendanceService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|uuid|exists:sections,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'date' => 'required|date',
        ]);

        $this->ensureCanManageSection($request, $validated['section_id'], $validated['academic_year_id']);

        return response()->json(
            $this->dailyAttendanceService->getSectionDailyAttendance(
                $validated['section_id'],
                $validated['academic_year_id'],
                $validated['date']
            )
        );
    }

    public function batchStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|uuid|exists:sections,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'date' => 'required|date',
            'checkpoint' => 'required|string|in:entrada,salida',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|uuid|exists:students,id',
            'records.*.status' => 'required|string|in:presente,tarde,falta,justificado',
            'records.*.note' => 'nullable|string|max:1000',
        ]);

        $this->ensureCanManageSection($request, $validated['section_id'], $validated['academic_year_id']);

        foreach ($validated['records'] as $record) {
            if (in_array($record['status'], ['falta', 'justificado'], true) && blank($record['note'] ?? null)) {
                throw ValidationException::withMessages([
                    'records' => 'Debes registrar un comentario para faltas o justificaciones.',
                ]);
            }
        }

        $result = $this->dailyAttendanceService->storeSectionCheckpoint(
            $validated['section_id'],
            $validated['academic_year_id'],
            $validated['date'],
            $validated['checkpoint'],
            $validated['records'],
            $this->resolveProfileId($request),
        );

        return response()->json([
            'message' => sprintf(
                'Se registraron %d estudiantes en %s. %d registros por curso fueron actualizados.',
                $result['processed_count'],
                $validated['checkpoint'],
                $result['propagated_records_count']
            ),
            ...$result,
        ]);
    }

    public function listQrSessions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|uuid|exists:sections,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'date' => 'nullable|date',
        ]);

        $this->ensureCanManageSection($request, $validated['section_id'], $validated['academic_year_id']);

        $sessions = AttendanceQrSession::query()
            ->where('section_id', $validated['section_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->when(
                !empty($validated['date']),
                fn ($query) => $query->whereDate('date', $validated['date'])
            )
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $sessions,
        ]);
    }

    public function createQrSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|uuid|exists:sections,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'date' => 'required|date',
            'checkpoint' => 'required|string|in:entrada,salida',
            'expires_in_minutes' => 'nullable|integer|min:1|max:240',
            'late_after_minutes' => 'nullable|integer|min:0|max:120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $this->ensureCanManageSection($request, $validated['section_id'], $validated['academic_year_id']);

        $session = $this->dailyAttendanceService->createQrSession(
            $validated['section_id'],
            $validated['academic_year_id'],
            $validated['date'],
            $validated['checkpoint'],
            (int) ($validated['expires_in_minutes'] ?? 20),
            (int) ($validated['late_after_minutes'] ?? ($validated['checkpoint'] === 'entrada' ? 10 : 0)),
            $this->resolveProfileId($request),
            $validated['notes'] ?? null,
        );

        return response()->json([
            'message' => 'Sesion QR creada correctamente.',
            'data' => $session,
        ], 201);
    }

    public function closeQrSession(Request $request, AttendanceQrSession $attendanceQrSession): JsonResponse
    {
        $this->ensureCanManageSection(
            $request,
            (string) $attendanceQrSession->section_id,
            (string) $attendanceQrSession->academic_year_id
        );

        return response()->json([
            'message' => 'Sesion QR cerrada.',
            'data' => $this->dailyAttendanceService->closeQrSession($attendanceQrSession),
        ]);
    }

    public function selfCheckpoint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_code' => 'required|string|min:6|max:16',
        ]);

        $student = Student::query()
            ->where('user_id', (string) $request->user()?->id)
            ->first();

        if (!$student) {
            throw ValidationException::withMessages([
                'student' => 'No se encontro un estudiante asociado al usuario autenticado.',
            ]);
        }

        $session = AttendanceQrSession::query()
            ->whereRaw('upper(session_code) = ?', [strtoupper($validated['session_code'])])
            ->latest('created_at')
            ->first();

        if (!$session) {
            throw ValidationException::withMessages([
                'session_code' => 'El codigo QR no existe o ya no esta disponible.',
            ]);
        }

        $result = $this->dailyAttendanceService->markStudentFromQrSession(
            $session,
            (string) $student->id,
            $this->resolveProfileId($request),
        );

        return response()->json([
            'message' => sprintf('Marcacion %s registrada correctamente.', $session->checkpoint_type),
            'checkpoint' => $session->checkpoint_type,
            'session' => $session->fresh(),
            ...$result,
        ]);
    }

    private function ensureCanManageSection(Request $request, string $sectionId, string $academicYearId): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');

        if (!$teacherId) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontro el docente asociado al usuario autenticado.',
            ]);
        }

        $hasAssignment = TeacherCourseAssignment::query()
            ->where('teacher_id', $teacherId)
            ->where('section_id', $sectionId)
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->exists();

        if (!$hasAssignment) {
            throw ValidationException::withMessages([
                'assignment' => 'No tienes una asignacion activa en esta seccion para gestionar asistencia diaria.',
            ]);
        }
    }

    private function resolveProfileId(Request $request): ?string
    {
        return $request->user()?->profile?->id
            ? (string) $request->user()->profile->id
            : null;
    }
}
