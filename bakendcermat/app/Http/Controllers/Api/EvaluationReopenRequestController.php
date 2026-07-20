<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\EvaluationReopenRequest;
use App\Models\Notification;
use App\Models\Period;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EvaluationReopenRequestController extends Controller
{
    private const WINDOW_HOURS = 24;

    private const APPROVER_ROLES = ['admin', 'director', 'coordinator'];

    // Docente: crea una solicitud de reapertura para una nota publicada
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'evaluation_id' => ['required', 'uuid', 'exists:evaluations,id'],
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $teacher = Teacher::query()
            ->where('user_id', (string) $request->user()->id)
            ->first();

        if (! $teacher) {
            return response()->json([
                'message' => 'No se encontro el docente asociado al usuario autenticado.',
            ], 422);
        }

        $evaluation = Evaluation::query()->findOrFail($data['evaluation_id']);

        if (! $this->teacherOwnsEvaluation((string) $teacher->id, $evaluation)) {
            return response()->json([
                'message' => 'No tienes una asignacion activa sobre esta evaluacion.',
            ], 403);
        }

        if ($evaluation->status !== 'publicada') {
            return response()->json([
                'message' => 'Solo se puede solicitar la reapertura de evaluaciones publicadas.',
            ], 422);
        }

        $alreadyPending = EvaluationReopenRequest::query()
            ->where('evaluation_id', (string) $evaluation->id)
            ->pending()
            ->exists();

        if ($alreadyPending) {
            return response()->json([
                'message' => 'Ya existe una solicitud pendiente para esta evaluacion.',
            ], 422);
        }

        if (EvaluationReopenRequest::hasActiveForEvaluation((string) $evaluation->id)) {
            return response()->json([
                'message' => 'Esta evaluacion ya tiene una reapertura aprobada y vigente.',
            ], 422);
        }

        $reopenRequest = EvaluationReopenRequest::create([
            'evaluation_id' => $evaluation->id,
            'teacher_id' => $teacher->id,
            'requested_by' => (string) $request->user()->id,
            'reason' => $data['reason'],
            'status' => 'pendiente',
        ]);

        $this->notifyApprovers($reopenRequest, $teacher, $evaluation);

        return response()->json(
            $reopenRequest->load(['evaluation.student', 'evaluation.course', 'evaluation.competency', 'evaluation.period']),
            201
        );
    }

    // Admin/director/coordinator: lista solicitudes (por defecto pendientes)
    public function index(Request $request)
    {
        $status = (string) $request->query('status', 'pendiente');

        $query = EvaluationReopenRequest::query()
            ->with([
                'evaluation.student',
                'evaluation.course',
                'evaluation.competency',
                'evaluation.period',
                'teacher',
                'approver',
            ])
            ->when(
                in_array($status, ['pendiente', 'aprobada', 'rechazada'], true),
                fn ($q) => $q->where('status', $status)
            );

        $perPage = max(1, min((int) $request->integer('per_page', 30), 200));

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function approve(Request $request, EvaluationReopenRequest $evaluationReopenRequest): JsonResponse
    {
        if ($evaluationReopenRequest->status !== 'pendiente') {
            return response()->json(['message' => 'La solicitud ya fue procesada.'], 422);
        }

        $evaluationReopenRequest->update([
            'status' => 'aprobada',
            'approved_by' => (string) $request->user()->id,
            'approved_at' => now(),
            'expires_at' => now()->addHours(self::WINDOW_HOURS),
        ]);

        $evaluationReopenRequest->refresh();

        $this->notifyTeacher(
            $evaluationReopenRequest,
            'Solicitud de reapertura aprobada',
            'Tu solicitud de reapertura fue aprobada. Puedes editar la nota hasta el '
                .$evaluationReopenRequest->expires_at?->format('d/m/Y H:i').'.'
        );

        return response()->json(
            $evaluationReopenRequest->load(['evaluation.student', 'evaluation.course', 'teacher', 'approver'])
        );
    }

    public function reject(Request $request, EvaluationReopenRequest $evaluationReopenRequest): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        if ($evaluationReopenRequest->status !== 'pendiente') {
            return response()->json(['message' => 'La solicitud ya fue procesada.'], 422);
        }

        $evaluationReopenRequest->update([
            'status' => 'rechazada',
            'approved_by' => (string) $request->user()->id,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        $this->notifyTeacher(
            $evaluationReopenRequest,
            'Solicitud de reapertura rechazada',
            'Tu solicitud de reapertura fue rechazada. Motivo: '.$data['rejection_reason']
        );

        return response()->json(
            $evaluationReopenRequest->fresh()->load(['evaluation.student', 'evaluation.course', 'teacher', 'approver'])
        );
    }

    // Misma regla de propiedad que EvaluationController: la relacion docente-evaluacion
    // se construye via enrollments + assignments, no via students.section_id.
    private function teacherOwnsEvaluation(string $teacherId, Evaluation $evaluation): bool
    {
        $periodAcademicYearId = Period::query()
            ->whereKey((string) $evaluation->period_id)
            ->value('academic_year_id');

        if (! $periodAcademicYearId) {
            return false;
        }

        return DB::table('student_course_enrollments as sce')
            ->join('teacher_course_assignments as tca', function ($join) {
                $join->on('tca.course_id', '=', 'sce.course_id')
                    ->on('tca.section_id', '=', 'sce.section_id')
                    ->on('tca.academic_year_id', '=', 'sce.academic_year_id');
            })
            ->where('sce.student_id', (string) $evaluation->student_id)
            ->where('sce.course_id', (string) $evaluation->course_id)
            ->where('sce.academic_year_id', $periodAcademicYearId)
            ->where('sce.status', 'active')
            ->where('tca.teacher_id', $teacherId)
            ->where('tca.is_active', true)
            ->exists();
    }

    private function notifyApprovers(EvaluationReopenRequest $reopenRequest, Teacher $teacher, Evaluation $evaluation): void
    {
        $evaluation->loadMissing(['student', 'course', 'competency', 'period']);

        $teacherName = trim($teacher->first_name.' '.$teacher->last_name) ?: ($teacher->email ?? 'Docente');
        $studentName = $evaluation->student?->full_name
            ?: trim(($evaluation->student?->last_name ?? '').', '.($evaluation->student?->first_name ?? ''), ', ');
        $courseName = $evaluation->course?->name ?? 'curso';
        $periodName = $evaluation->period?->name ?? '';

        $message = "El docente {$teacherName} solicita reabrir la nota de {$studentName} en {$courseName}"
            .($periodName ? " ({$periodName})" : '')
            .'. Motivo: '.Str::limit($reopenRequest->reason, 200);

        $approvers = User::query()
            ->whereHas('profile', function ($q) {
                $q->whereIn('role', self::APPROVER_ROLES);
            })
            ->get();

        foreach ($approvers as $approver) {
            Notification::create([
                'user_id' => (string) $approver->id,
                'type' => 'solicitud_reapertura',
                'title' => 'Solicitud de reapertura de nota',
                'message' => $message,
                'status' => 'no_leida',
                'related_entity_type' => 'evaluation_reopen_request',
                'related_entity_id' => (string) $reopenRequest->id,
            ]);
        }
    }

    private function notifyTeacher(EvaluationReopenRequest $reopenRequest, string $title, string $message): void
    {
        $teacherUserId = $reopenRequest->requested_by
            ?: $reopenRequest->teacher?->user_id;

        if (! $teacherUserId) {
            return;
        }

        Notification::create([
            'user_id' => (string) $teacherUserId,
            'type' => 'solicitud_reapertura',
            'title' => $title,
            'message' => $message,
            'status' => 'no_leida',
            'related_entity_type' => 'evaluation_reopen_request',
            'related_entity_id' => (string) $reopenRequest->id,
        ]);
    }
}
