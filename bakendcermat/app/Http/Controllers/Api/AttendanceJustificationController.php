<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceJustification;
use App\Models\Guardian;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceJustificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = AttendanceJustification::query()
            ->with($this->defaultRelations());

        if ($this->isGuardianRequest($request)) {
            $guardian = $this->resolveGuardianFromRequest($request);
            abort_unless($guardian, 403, 'Apoderado no vinculado.');

            $studentIds = $guardian->students()->pluck('students.id');

            $q->where('guardian_id', $guardian->id)
                ->whereHas('attendance', fn (Builder $query) => $query->whereIn('student_id', $studentIds));
        }

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if (!$this->isGuardianRequest($request) && $request->filled('guardian_id')) {
            $q->where('guardian_id', $request->guardian_id);
        }
        if ($request->filled('attendance_id')) {
            $q->where('attendance_id', $request->attendance_id);
        }
        if ($request->filled('student_id')) {
            $studentId = (string) $request->string('student_id');
            $q->whereHas('attendance', fn (Builder $query) => $query->where('student_id', $studentId));
        }
        if ($request->filled('course_id')) {
            $courseId = (string) $request->string('course_id');
            $q->whereHas('attendance', fn (Builder $query) => $query->where('course_id', $courseId));
        }
        if ($request->filled('section_id')) {
            $sectionId = (string) $request->string('section_id');
            $q->whereHas('attendance', fn (Builder $query) => $query->where('section_id', $sectionId));
        }
        if ($request->filled('date')) {
            $date = $request->date;
            $q->whereHas('attendance', fn (Builder $query) => $query->whereDate('date', $date));
        }
        if ($request->filled('date_from')) {
            $dateFrom = $request->date_from;
            $q->whereHas('attendance', fn (Builder $query) => $query->whereDate('date', '>=', $dateFrom));
        }
        if ($request->filled('date_to')) {
            $dateTo = $request->date_to;
            $q->whereHas('attendance', fn (Builder $query) => $query->whereDate('date', '<=', $dateTo));
        }

        $perPage = (int) $request->integer('per_page', 30);

        return response()->json(
            $q->orderByRaw("case when status = 'pendiente' then 0 else 1 end")
                ->orderByDesc('created_at')
                ->paginate($perPage)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $guardian = $this->isGuardianRequest($request)
            ? $this->resolveGuardianFromRequest($request)
            : null;

        abort_if($this->isGuardianRequest($request) && !$guardian, 403, 'Apoderado no vinculado.');

        $data = $request->validate([
            'attendance_id' => ['required', 'uuid', 'exists:attendance,id'],
            'guardian_id' => [
                Rule::requiredIf(!$this->isGuardianRequest($request)),
                'nullable',
                'uuid',
                'exists:guardians,id',
            ],
            'reason' => ['required', 'string', 'max:1500'],
            'status' => ['sometimes', 'string', Rule::in(['pendiente', 'aprobada', 'rechazada'])],
        ]);

        $attendance = Attendance::query()->findOrFail($data['attendance_id']);
        abort_if($attendance->status === 'presente', 422, 'No se puede justificar una asistencia marcada como presente.');

        $guardianId = $guardian?->id ?? $data['guardian_id'];

        if ($guardian) {
            $hasAccess = $guardian->students()
                ->where('students.id', $attendance->student_id)
                ->exists();

            abort_unless($hasAccess, 403, 'No puedes justificar asistencia para este estudiante.');
        }

        $payload = [
            'attendance_id' => $attendance->id,
            'guardian_id' => $guardianId,
            'reason' => $data['reason'],
            'status' => $guardian ? 'pendiente' : ($data['status'] ?? 'pendiente'),
        ];

        if ($this->hasColumn('attendance_justifications', 'student_id')) {
            $payload['student_id'] = $attendance->student_id;
        }
        if ($this->hasColumn('attendance_justifications', 'reviewed_by')) {
            $payload['reviewed_by'] = null;
        }
        if ($this->hasColumn('attendance_justifications', 'reviewed_at')) {
            $payload['reviewed_at'] = null;
        }
        if ($this->hasColumn('attendance_justifications', 'review_notes')) {
            $payload['review_notes'] = null;
        }

        $just = AttendanceJustification::query()->firstOrNew([
            'attendance_id' => $attendance->id,
            'guardian_id' => $guardianId,
        ]);

        $just->fill($payload);
        $just->save();

        return response()->json($just->load($this->defaultRelations()), 201);
    }

    public function show(Request $request, AttendanceJustification $attendanceJustification): JsonResponse
    {
        $this->authorizeGuardianJustification($request, $attendanceJustification);

        return response()->json(
            $attendanceJustification->load($this->defaultRelations())
        );
    }

    public function approve(Request $request, AttendanceJustification $attendanceJustification): JsonResponse
    {
        $data = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $update = [
            'status' => 'aprobada',
        ];

        if ($this->hasColumn('attendance_justifications', 'reviewed_by')) {
            $update['reviewed_by'] = $request->user()->id;
        }
        if ($this->hasColumn('attendance_justifications', 'reviewed_at')) {
            $update['reviewed_at'] = now();
        }
        if ($this->hasColumn('attendance_justifications', 'review_notes')) {
            $update['review_notes'] = $data['review_notes'] ?? null;
        }

        $attendanceJustification->update($update);

        $attendance = Attendance::find($attendanceJustification->attendance_id);
        if ($attendance) {
            $attendance->update(['status' => 'justificado']);
        }

        return response()->json(
            $attendanceJustification->fresh()->load($this->defaultRelations())
        );
    }

    public function reject(Request $request, AttendanceJustification $attendanceJustification): JsonResponse
    {
        $data = $request->validate([
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $update = [
            'status' => 'rechazada',
        ];

        if ($this->hasColumn('attendance_justifications', 'reviewed_by')) {
            $update['reviewed_by'] = $request->user()->id;
        }
        if ($this->hasColumn('attendance_justifications', 'reviewed_at')) {
            $update['reviewed_at'] = now();
        }
        if ($this->hasColumn('attendance_justifications', 'review_notes')) {
            $update['review_notes'] = $data['review_notes'];
        }

        $attendanceJustification->update($update);

        return response()->json(
            $attendanceJustification->fresh()->load($this->defaultRelations())
        );
    }

    public function destroy(AttendanceJustification $attendanceJustification): JsonResponse
    {
        $attendanceJustification->delete();

        return response()->json(['message' => 'Justificacion eliminada.']);
    }

    private function hasColumn(string $table, string $column): bool
    {
        return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
    }

    private function defaultRelations(): array
    {
        return [
            'guardian',
            'attendance.student',
            'attendance.course',
            'attendance.section.gradeLevel',
        ];
    }

    private function isGuardianRequest(Request $request): bool
    {
        return (string) optional($request->user()?->loadMissing('profile')->profile)->role === 'guardian';
    }

    private function resolveGuardianFromRequest(Request $request): ?Guardian
    {
        $userId = (string) optional($request->user())->id;

        if ($userId === '') {
            return null;
        }

        return Guardian::query()
            ->where('user_id', $userId)
            ->first();
    }

    private function authorizeGuardianJustification(Request $request, AttendanceJustification $attendanceJustification): void
    {
        if (!$this->isGuardianRequest($request)) {
            return;
        }

        $guardian = $this->resolveGuardianFromRequest($request);
        abort_unless($guardian, 403, 'Apoderado no vinculado.');

        $hasAccess = $attendanceJustification->guardian_id === $guardian->id
            && $guardian->students()
                ->where('students.id', $attendanceJustification->attendance?->student_id)
                ->exists();

        abort_unless($hasAccess, 403, 'No tienes acceso a esta justificacion.');
    }
}
