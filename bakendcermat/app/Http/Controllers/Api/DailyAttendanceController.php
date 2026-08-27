<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceQrSession;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use App\Services\DailyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'date' => 'required|string|date_format:Y-m-d',
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

    /**
     * GET /api/attendance/daily/export?date_from=...&date_to=...&section_id=...&grade_level_id=...&student_id=...
     * Exporta a CSV la asistencia diaria (checkpoint de entrada) del rango indicado.
     * Si no se envian fechas exporta el historico completo; con student_id se
     * genera el reporte individual de un estudiante.
     */
    public function exportCsv(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'academic_year_id' => 'nullable|uuid|exists:academic_years,id',
            'student_id' => 'nullable|uuid|exists:students,id',
        ]);

        $academicYearId = $validated['academic_year_id']
            ?? DB::table('academic_years')->where('is_active', true)->value('id');

        $rows = DB::table('attendance_daily_records as adr')
            ->join('students as s', 's.id', '=', 'adr.student_id')
            ->join('sections as sec', 'sec.id', '=', 'adr.section_id')
            ->leftJoin('grade_levels as gl', 'gl.id', '=', 'sec.grade_level_id')
            ->when(
                !empty($validated['date_from']) && !empty($validated['date_to']),
                fn ($q) => $q->whereBetween('adr.date', [$validated['date_from'], $validated['date_to']])
            )
            ->when($academicYearId, fn ($q) => $q->where('adr.academic_year_id', $academicYearId))
            ->when(!empty($validated['section_id']), fn ($q) => $q->where('adr.section_id', $validated['section_id']))
            ->when(!empty($validated['grade_level_id']), fn ($q) => $q->where('sec.grade_level_id', $validated['grade_level_id']))
            ->when(!empty($validated['student_id']), fn ($q) => $q->where('adr.student_id', $validated['student_id']))
            ->orderBy('adr.date')
            ->orderBy('s.last_name')
            ->orderBy('s.first_name')
            ->select([
                'adr.date',
                's.last_name',
                's.first_name',
                'gl.name as grade_name',
                'sec.section_letter',
                'adr.entry_status',
                'adr.entry_marked_at',
                'adr.exit_status',
                'adr.exit_marked_at',
                'adr.entry_note',
                'adr.exit_note',
            ])
            ->get();

        $statusMap = ['presente' => 'P', 'tarde' => 'T', 'falta' => 'F', 'justificado' => 'J'];
        $rangeLabel = !empty($validated['date_from']) && !empty($validated['date_to'])
            ? sprintf('%s_a_%s', $validated['date_from'], $validated['date_to'])
            : 'historico';
        $filename = sprintf('asistencia_%s%s.csv', $rangeLabel, !empty($validated['student_id']) ? '_individual' : '');

        return response()->streamDownload(function () use ($rows, $statusMap) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Fecha', 'Alumno', 'Seccion', 'Estado', 'Hora de registro', 'Observacion']);

            foreach ($rows as $row) {
                // El estado "oficial" del dia es el de entrada; si no fue marcado
                // pero si hay salida registrada, se usa ese como respaldo.
                $status = $row->entry_status ?: $row->exit_status;
                if (empty($status)) {
                    continue;
                }
                $markedAt = $row->entry_status ? $row->entry_marked_at : $row->exit_marked_at;
                $note = $row->entry_status ? $row->entry_note : $row->exit_note;

                fputcsv($handle, [
                    $row->date,
                    trim($row->last_name . ', ' . $row->first_name),
                    trim(($row->grade_name ?? '') . ' ' . ($row->section_letter ?? '')),
                    $statusMap[$status] ?? $status,
                    $markedAt ? Carbon::parse($markedAt)->format('H:i') : '',
                    (string) ($note ?? ''),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function batchStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|uuid|exists:sections,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'date' => 'required|string|date_format:Y-m-d',
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
            'date' => 'nullable|string|date_format:Y-m-d',
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
            'date' => 'required|string|date_format:Y-m-d',
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

        $userRole = $request->user()?->profile?->role;

        // --- Rama: Docente ---
        if ($userRole === 'teacher') {
            $teacher = Teacher::query()
                ->where('user_id', (string) $request->user()?->id)
                ->first();

            if (!$teacher) {
                throw ValidationException::withMessages([
                    'teacher' => 'No se encontro un docente asociado al usuario autenticado.',
                ]);
            }

            $session = AttendanceQrSession::query()
                ->whereRaw('upper(session_code) = ?', [strtoupper($validated['session_code'])])
                ->where('status', 'activo')
                ->where('expires_at', '>', now())
                ->latest('created_at')
                ->first();

            if (!$session) {
                throw ValidationException::withMessages([
                    'session_code' => 'El codigo QR no existe o ya no esta disponible.',
                ]);
            }

            $status = 'presente';
            if (
                $session->checkpoint_type === 'entrada'
                && $session->opened_at
                && now()->greaterThan($session->opened_at->copy()->addMinutes((int) $session->late_after_minutes))
            ) {
                $status = 'tarde';
            }

            $dailyRecord = $this->dailyAttendanceService->storeTeacherCheckpoint(
                (string) $teacher->id,
                (string) $session->section_id,
                (string) $session->academic_year_id,
                (string) $session->getRawOriginal('date'),
                (string) $session->checkpoint_type,
                $status,
                sprintf('Marcado por QR %s.', $session->session_code),
                'qr'
            );

            return response()->json([
                'message'         => sprintf('Marcacion %s registrada correctamente.', $session->checkpoint_type),
                'checkpoint'      => $session->checkpoint_type,
                'session'         => $session->fresh(),
                'daily_record'    => $dailyRecord,
                'processed_count' => 1,
            ]);
        }

        // --- Rama: Estudiante (lógica original) ---
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
            ->where('status', 'activo')
            ->where('expires_at', '>', now())
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
            'message'    => sprintf('Marcacion %s registrada correctamente.', $session->checkpoint_type),
            'checkpoint' => $session->checkpoint_type,
            'session'    => $session->fresh(),
            ...$result,
        ]);
    }

    /**
     * GET /api/attendance/daily/my-history?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
     * Historial de marcaciones diarias (entrada/salida) del docente autenticado.
     */
    public function myDailyHistory(Request $request): JsonResponse
    {
        $teacher = Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->first();

        if (!$teacher) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontro un docente asociado al usuario autenticado.',
            ]);
        }

        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $dailyRecords = $this->dailyAttendanceService->getTeacherDailyRecords(
            (string) $teacher->id,
            $dateFrom ? (string) $dateFrom : null,
            $dateTo ? (string) $dateTo : null
        );

        $countsByStatus = $dailyRecords
            ->groupBy('entry_status')
            ->filter(fn ($group, $status) => !empty($status))
            ->map(fn ($group, $status) => ['status' => $status, 'total' => $group->count()])
            ->values();

        return response()->json([
            'teacher_id' => (string) $teacher->id,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'counts_by_status' => $countsByStatus,
            'daily_records' => $dailyRecords,
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
