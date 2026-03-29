<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEvaluationRequest;
use App\Http\Requests\UpdateEvaluationRequest;
use App\Models\AcademicYear;
use App\Models\Evaluation;
use App\Models\Period;
use App\Models\Teacher;
use App\Models\TeacherCourseAssignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class EvaluationController extends Controller
{
    public function myContext(Request $request): JsonResponse
    {
        $role = $request->user()?->profile?->role;
        $teacher = null;
        $teacherId = null;

        if ($role === 'teacher') {
            $teacher = Teacher::query()
                ->where('user_id', (string) $request->user()?->id)
                ->first();

            if (!$teacher) {
                return response()->json([
                    'teacher' => null,
                    'active_academic_year' => null,
                    'periods' => [],
                    'assignments' => [],
                    'message' => 'No se encontro el docente asociado al usuario autenticado.',
                ]);
            }

            $teacherId = (string) $teacher->id;
        }

        $activeAcademicYear = AcademicYear::query()
            ->where('is_active', true)
            ->orderByDesc('year')
            ->first();

        $assignments = TeacherCourseAssignment::query()
            ->with(['teacher', 'course', 'section.gradeLevel', 'academicYear'])
            ->when($teacherId, fn (Builder $query) => $query->where('teacher_id', $teacherId))
            ->when($activeAcademicYear?->id, fn (Builder $query) => $query->where('academic_year_id', (string) $activeAcademicYear->id))
            ->where('is_active', true)
            ->orderByDesc('assigned_at')
            ->orderByDesc('created_at')
            ->get()
            ->values();

        $periods = $activeAcademicYear
            ? Period::query()
                ->where('academic_year_id', (string) $activeAcademicYear->id)
                ->orderBy('period_number')
                ->orderBy('start_date')
                ->get()
                ->values()
            : collect();

        return response()->json([
            'teacher' => $teacher,
            'active_academic_year' => $activeAcademicYear,
            'periods' => $periods,
            'assignments' => $assignments,
        ]);
    }

    public function index(Request $request)
    {
        $query = Evaluation::query()->with(['student', 'course', 'competency', 'period']);

        $this->applyTeacherScope($query, $request);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        if ($request->filled('period_id')) {
            $query->where('period_id', $request->period_id);
        }
        if ($request->filled('competency_id')) {
            $query->where('competency_id', $request->competency_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('section_id')) {
            $this->applySectionFilter($query, (string) $request->section_id);
        }

        $perPage = max(1, min((int) $request->integer('per_page', 50), 1000));

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function store(StoreEvaluationRequest $request): JsonResponse
    {
        $data = $this->normalizePayload($request->validated(), $request);

        $this->ensureTeacherCanManageEvaluation(
            $request,
            (string) $data['student_id'],
            (string) $data['course_id'],
            (string) $data['period_id']
        );

        $evaluation = Evaluation::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'competency_id' => $data['competency_id'],
                'period_id' => $data['period_id'],
            ],
            $data
        );

        return response()->json($evaluation->fresh()->load(['student', 'course', 'competency', 'period']), 201);
    }

    public function show(Request $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        return $evaluation->load(['student', 'course', 'competency', 'period']);
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        if ($evaluation->status === 'cerrada') {
            return response()->json([
                'message' => 'La evaluacion esta cerrada y no puede modificarse.',
            ], 422);
        }

        $data = $this->normalizePayload($request->validated(), $request, false);
        $evaluation->update($data);

        return $evaluation->fresh()->load(['student', 'course', 'competency', 'period']);
    }

    public function destroy(Request $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        $evaluation->delete();

        return response()->noContent();
    }

    public function publish(Request $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        $evaluation->update([
            'status' => 'publicada',
            'published_at' => now(),
        ]);

        return $evaluation->fresh()->load(['student', 'course', 'competency', 'period']);
    }

    public function close(Request $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        $payload = [
            'status' => 'cerrada',
        ];

        if (!$evaluation->published_at) {
            $payload['published_at'] = now();
        }

        $evaluation->update($payload);

        return $evaluation->fresh()->load(['student', 'course', 'competency', 'period']);
    }

    public function draft(Request $request, Evaluation $evaluation)
    {
        $this->ensureTeacherOwnsEvaluation($request, $evaluation);

        if ($evaluation->status === 'cerrada') {
            return response()->json([
                'message' => 'La evaluacion cerrada no puede volver a borrador.',
            ], 422);
        }

        $evaluation->update(['status' => 'borrador']);

        return $evaluation->fresh()->load(['student', 'course', 'competency', 'period']);
    }

    private function normalizePayload(array $data, Request $request, bool $isCreate = true): array
    {
        if (array_key_exists('comments', $data) && !array_key_exists('observations', $data)) {
            $data['observations'] = $data['comments'];
        }

        unset($data['comments']);

        $recorderId = $this->resolveRecorderId($request);
        if ($recorderId) {
            $data['recorded_by'] = $recorderId;
        } else {
            unset($data['recorded_by']);
        }

        if (($data['status'] ?? null) === 'publicada' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        if (!$isCreate) {
            unset($data['student_id'], $data['course_id'], $data['competency_id'], $data['period_id']);
        }

        return $data;
    }

    private function applyTeacherScope(Builder $query, Request $request): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->whereExists(function ($subQuery) use ($teacherId) {
            $subQuery->select(DB::raw(1))
                ->from('student_course_enrollments as sce')
                ->join('periods as p', 'p.academic_year_id', '=', 'sce.academic_year_id')
                ->join('teacher_course_assignments as tca', function ($join) {
                    $join->on('tca.course_id', '=', 'sce.course_id')
                        ->on('tca.section_id', '=', 'sce.section_id')
                        ->on('tca.academic_year_id', '=', 'sce.academic_year_id');
                })
                ->whereColumn('sce.student_id', 'evaluations.student_id')
                ->whereColumn('sce.course_id', 'evaluations.course_id')
                ->whereColumn('p.id', 'evaluations.period_id')
                ->where('sce.status', 'active')
                ->where('tca.teacher_id', $teacherId)
                ->where('tca.is_active', true);
        });
    }

    private function applySectionFilter(Builder $query, string $sectionId): void
    {
        $query->whereExists(function ($subQuery) use ($sectionId) {
            $subQuery->select(DB::raw(1))
                ->from('student_course_enrollments as sce')
                ->join('periods as p', 'p.academic_year_id', '=', 'sce.academic_year_id')
                ->whereColumn('sce.student_id', 'evaluations.student_id')
                ->whereColumn('sce.course_id', 'evaluations.course_id')
                ->whereColumn('p.id', 'evaluations.period_id')
                ->where('sce.section_id', $sectionId)
                ->where('sce.status', 'active');
        });
    }

    private function ensureTeacherOwnsEvaluation(Request $request, Evaluation $evaluation): void
    {
        $this->ensureTeacherCanManageEvaluation(
            $request,
            (string) $evaluation->student_id,
            (string) $evaluation->course_id,
            (string) $evaluation->period_id
        );
    }

    private function ensureTeacherCanManageEvaluation(Request $request, string $studentId, string $courseId, string $periodId): void
    {
        if ($request->user()?->profile?->role !== 'teacher') {
            return;
        }

        $teacherId = $this->resolveTeacherId($request);

        if (!$teacherId) {
            throw ValidationException::withMessages([
                'teacher' => 'No se encontro el docente asociado al usuario autenticado.',
            ]);
        }

        $periodAcademicYearId = Period::query()
            ->whereKey($periodId)
            ->value('academic_year_id');

        $isAssigned = $periodAcademicYearId
            ? DB::table('student_course_enrollments as sce')
                ->join('teacher_course_assignments as tca', function ($join) {
                    $join->on('tca.course_id', '=', 'sce.course_id')
                        ->on('tca.section_id', '=', 'sce.section_id')
                        ->on('tca.academic_year_id', '=', 'sce.academic_year_id');
                })
                ->where('sce.student_id', $studentId)
                ->where('sce.course_id', $courseId)
                ->where('sce.academic_year_id', $periodAcademicYearId)
                ->where('sce.status', 'active')
                ->where('tca.teacher_id', $teacherId)
                ->where('tca.is_active', true)
                ->exists()
            : false;

        if (!$isAssigned) {
            throw ValidationException::withMessages([
                'assignment' => 'No tienes una asignacion activa para evaluar este estudiante en ese curso y periodo.',
            ]);
        }
    }

    private function resolveTeacherId(Request $request): ?string
    {
        return Teacher::query()
            ->where('user_id', (string) $request->user()?->id)
            ->value('id');
    }

    private function resolveRecorderId(Request $request): ?string
    {
        $authUser = $request->user();

        if (!$authUser) {
            return null;
        }

        $emailCandidates = array_values(array_filter([
            $authUser->email ?? null,
            $authUser->profile?->email ?? null,
        ]));

        foreach ($emailCandidates as $email) {
            $authSchemaUserId = DB::table('auth.users')
                ->whereRaw('lower(email) = ?', [strtolower((string) $email)])
                ->value('id');

            if ($authSchemaUserId) {
                Log::info('EvaluationController: resolved recorded_by from auth.users', [
                    'email' => (string) $email,
                    'recorded_by' => (string) $authSchemaUserId,
                ]);

                return (string) $authSchemaUserId;
            }
        }

        $candidateIds = array_values(array_filter([
            $authUser->id ?? null,
            $authUser->user_id ?? null,
            $authUser->profile?->user_id ?? null,
        ]));

        foreach ($candidateIds as $candidateId) {
            $candidateId = (string) $candidateId;

            if ($candidateId !== '' && DB::table('auth.users')->where('id', $candidateId)->exists()) {
                Log::info('EvaluationController: resolved recorded_by from auth.users candidate', [
                    'recorded_by' => $candidateId,
                ]);

                return $candidateId;
            }
        }

        Log::warning('EvaluationController: Could not resolve valid recorder_id', [
            'auth_user_id' => $authUser->id ?? 'null',
            'auth_user_user_id' => $authUser->user_id ?? 'null',
            'auth_profile_user_id' => $authUser->profile?->user_id ?? 'null',
            'auth_user_email' => $authUser->email ?? 'null',
            'auth_profile_email' => $authUser->profile?->email ?? 'null',
            'candidate_ids' => $candidateIds,
        ]);

        return null;
    }
}
