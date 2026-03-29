<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\Guardian;
use App\Models\Notification;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $q = Announcement::with(['creator.user', 'approver.user', 'section.gradeLevel']);
        $profile = $request->user()?->loadMissing('profile')?->profile;
        $role = $profile?->role;

        if ($role === 'teacher' && $profile?->id) {
            $q->where('created_by', $profile->id);
        }

        if (in_array($role, ['guardian', 'student'], true)) {
            $this->applyPublishedAudienceVisibility($q, $request, $role);
        }

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }

        if ($request->filled('audience')) {
            $q->where('audience', $request->audience);
        }

        return $q->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate(30);
    }

    public function store(StoreAnnouncementRequest $request)
    {
        $data = $request->validated();
        $profile = $request->user()?->loadMissing('profile')?->profile;

        $data['status'] = 'borrador';
        $data['created_by'] = $profile?->id ?? $request->user()->id;

        $announcement = Announcement::create($data);

        return response()->json($announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']), 201);
    }

    public function show(Request $request, Announcement $announcement)
    {
        if ($response = $this->ensureCanAccessAnnouncement($request, $announcement)) {
            return $response;
        }

        return $announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement)
    {
        if ($response = $this->ensureTeacherOwnsAnnouncement($request, $announcement)) {
            return $response;
        }

        $announcement->update($request->validated());

        return $announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']);
    }

    public function destroy(Request $request, Announcement $announcement)
    {
        if ($response = $this->ensureTeacherOwnsAnnouncement($request, $announcement)) {
            return $response;
        }

        $announcement->delete();

        return response()->noContent();
    }

    public function requestApproval(Request $request, Announcement $announcement)
    {
        if ($response = $this->ensureTeacherOwnsAnnouncement($request, $announcement)) {
            return $response;
        }

        if ($announcement->status !== 'borrador') {
            return response()->json([
                'message' => 'Solo los comunicados en borrador pueden enviarse a aprobacion.'
            ], 422);
        }

        $announcement->update([
            'status' => 'pendiente_aprobacion'
        ]);

        return $announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']);
    }

    public function approve(Request $request, Announcement $announcement)
    {
        if ($response = $this->ensureApprovalRole($request)) {
            return $response;
        }

        if ($announcement->status !== 'pendiente_aprobacion') {
            return response()->json([
                'message' => 'Solo los comunicados pendientes pueden aprobarse.'
            ], 422);
        }

        $profile = $request->user()?->loadMissing('profile')?->profile;

        $announcement->update([
            'status' => 'publicado',
            'approved_by' => $profile?->id ?? $request->user()->id,
            'published_at' => now()
        ]);

        $announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']);

        $this->notifyCreator(
            $announcement,
            'Tu comunicado fue aprobado',
            sprintf('El comunicado "%s" fue aprobado y publicado.', $announcement->title)
        );

        return $announcement;
    }

    public function archive(Request $request, Announcement $announcement)
    {
        if ($response = $this->ensureApprovalRole($request)) {
            return $response;
        }

        if ($announcement->status === 'archivado') {
            return response()->json([
                'message' => 'El comunicado ya se encuentra archivado.'
            ], 422);
        }

        $validated = $request->validate([
            'review_comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $announcement->update([
            'status' => 'archivado'
        ]);

        $announcement->load(['creator.user', 'approver.user', 'section.gradeLevel']);

        $message = sprintf('El comunicado "%s" fue archivado por administracion.', $announcement->title);
        if (!empty($validated['review_comment'])) {
            $message .= ' Motivo: ' . $validated['review_comment'];
        }

        $this->notifyCreator(
            $announcement,
            'Tu comunicado fue rechazado',
            $message
        );

        return $announcement;
    }

    private function ensureCanAccessAnnouncement(Request $request, Announcement $announcement)
    {
        $profile = $request->user()?->loadMissing('profile')?->profile;
        $role = $profile?->role;

        if ($role === 'teacher' && (string) $announcement->created_by !== (string) $profile?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array($role, ['guardian', 'student'], true) && !$this->canViewPublishedAnnouncement($request, $announcement, $role)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return null;
    }

    private function ensureTeacherOwnsAnnouncement(Request $request, Announcement $announcement)
    {
        $profile = $request->user()?->loadMissing('profile')?->profile;
        $role = $profile?->role;

        if ($role === 'teacher' && (string) $announcement->created_by !== (string) $profile?->id) {
            return response()->json(['message' => 'Solo puedes modificar tus propios comunicados.'], 403);
        }

        return null;
    }

    private function ensureApprovalRole(Request $request)
    {
        $role = $request->user()?->loadMissing('profile')?->profile?->role;
        $allowedRoles = ['admin', 'director', 'coordinator', 'secretary'];

        if (!in_array($role, $allowedRoles, true)) {
            return response()->json(['message' => 'No tienes permiso para aprobar o archivar comunicados.'], 403);
        }

        return null;
    }

    private function applyPublishedAudienceVisibility($query, Request $request, string $role): void
    {
        $sectionIds = $this->resolveVisibleSectionIds($request, $role);
        $baseAudiences = $role === 'guardian'
            ? ['todos', 'apoderados', 'estudiantes']
            : ['todos', 'estudiantes'];

        $query->where('status', 'publicado')
            ->where(function ($audienceQuery) use ($baseAudiences, $sectionIds) {
                $audienceQuery->whereIn('audience', $baseAudiences);

                if (!empty($sectionIds)) {
                    $audienceQuery->orWhere(function ($sectionQuery) use ($sectionIds) {
                        $sectionQuery->where('audience', 'seccion_especifica')
                            ->whereIn('section_id', $sectionIds);
                    });
                }
            });
    }

    private function canViewPublishedAnnouncement(Request $request, Announcement $announcement, string $role): bool
    {
        if ($announcement->status !== 'publicado') {
            return false;
        }

        $allowedAudiences = $role === 'guardian'
            ? ['todos', 'apoderados', 'estudiantes']
            : ['todos', 'estudiantes'];

        if (in_array($announcement->audience, $allowedAudiences, true)) {
            return true;
        }

        if ($announcement->audience !== 'seccion_especifica') {
            return false;
        }

        return in_array((string) $announcement->section_id, $this->resolveVisibleSectionIds($request, $role), true);
    }

    private function resolveVisibleSectionIds(Request $request, string $role): array
    {
        $user = $request->user();
        if (!$user) {
            return [];
        }

        if ($role === 'student') {
            return Student::query()
                ->where('user_id', $user->id)
                ->whereNotNull('section_id')
                ->pluck('section_id')
                ->filter()
                ->map(fn ($id) => (string) $id)
                ->unique()
                ->values()
                ->all();
        }

        if ($role === 'guardian') {
            $guardian = Guardian::query()
                ->where('user_id', $user->id)
                ->first();

            if (!$guardian) {
                return [];
            }

            return $guardian->students()
                ->whereNotNull('students.section_id')
                ->pluck('students.section_id')
                ->filter()
                ->map(fn ($id) => (string) $id)
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }

    private function notifyCreator(Announcement $announcement, string $title, string $message): void
    {
        $creatorUserId = $announcement->creator?->user?->id;
        if (!$creatorUserId) {
            return;
        }

        $payload = [
            'user_id' => $creatorUserId,
            'type' => 'comunicado_nuevo',
            'status' => 'no_leida',
        ];

        if (Schema::hasColumn('notifications', 'title')) {
            $payload['title'] = $title;
        }

        if (Schema::hasColumn('notifications', 'message')) {
            $payload['message'] = $message;
        }

        if (Schema::hasColumn('notifications', 'related_entity_type')) {
            $payload['related_entity_type'] = 'announcement';
        }

        if (Schema::hasColumn('notifications', 'related_entity_id')) {
            $payload['related_entity_id'] = $announcement->id;
        }

        Notification::create($payload);
    }
}
