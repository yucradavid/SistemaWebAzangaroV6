<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriodHistory;
use App\Models\AcademicPeriodStudentSnapshot;
use App\Models\Guardian;
use App\Models\Period;
use App\Models\Student;
use App\Services\AcademicPeriodHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PeriodHistoryController extends Controller
{
    public function __construct(
        private readonly AcademicPeriodHistoryService $academicPeriodHistoryService
    ) {
    }

    public function show(Request $request, Period $period): JsonResponse
    {
        $role = (string) ($request->user()?->profile?->role ?? '');
        $history = AcademicPeriodHistory::query()
            ->with(['period', 'academicYear', 'generatedBy'])
            ->where('period_id', $period->id)
            ->first();

        if (!$history) {
            return response()->json([
                'message' => 'No existe historial generado para este periodo.',
            ], 404);
        }

        $payload = [
            'history' => $history,
        ];

        if ($request->boolean('include_students', false)) {
            $studentIds = $this->resolveAccessibleStudentIds($request, $role);
            $requestedStudentId = $request->filled('student_id')
                ? (string) $request->string('student_id')
                : null;

            if ($requestedStudentId && $studentIds !== null && !in_array($requestedStudentId, $studentIds, true)) {
                throw ValidationException::withMessages([
                    'student_id' => 'No tienes permiso para consultar ese historial academico.',
                ]);
            }

            $query = AcademicPeriodStudentSnapshot::query()
                ->where('academic_period_history_id', $history->id)
                ->when(
                    $requestedStudentId,
                    fn ($query) => $query->where('student_id', $requestedStudentId)
                )
                ->when(
                    $studentIds !== null,
                    fn ($query) => $query->whereIn('student_id', $studentIds)
                )
                ->orderBy('student_name');

            $payload['student_snapshots'] = $query->paginate((int) $request->integer('per_page', 25));
        }

        return response()->json($payload);
    }

    public function regenerate(Request $request, Period $period): JsonResponse
    {
        $history = $this->academicPeriodHistoryService->generateForPeriod($period, $request->user()?->id);

        return response()->json([
            'message' => $period->is_closed
                ? 'Historial del periodo regenerado correctamente.'
                : 'Snapshot preliminar del periodo generado correctamente.',
            'data' => $history,
        ]);
    }

    private function resolveAccessibleStudentIds(Request $request, string $role): ?array
    {
        if ($role === 'student') {
            $studentId = Student::query()
                ->where('user_id', (string) $request->user()?->id)
                ->value('id');

            return $studentId ? [(string) $studentId] : [];
        }

        if ($role === 'guardian') {
            $guardianId = Guardian::query()
                ->where('user_id', (string) $request->user()?->id)
                ->value('id');

            if (!$guardianId) {
                return [];
            }

            return \Illuminate\Support\Facades\DB::table('student_guardians')
                ->where('guardian_id', $guardianId)
                ->pluck('student_id')
                ->map(fn ($studentId) => (string) $studentId)
                ->values()
                ->all();
        }

        return null;
    }
}
