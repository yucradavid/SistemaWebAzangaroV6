<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Requests\UpdateMessageRequest;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notification;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->user()?->profile?->role;

        // Bandeja propia del estudiante: solo mensajes donde exista un
        // message_recipients explicito para su propio usuario (no todos los
        // mensajes de su student_id, que pueden ser conversaciones privadas
        // docente<->apoderado no dirigidas a el).
        if ($role === 'student') {
            return $this->studentInbox($request);
        }

        $allowedStudentIds = $this->resolveAllowedStudentIds($request);

        $q = Message::with(['student', 'sender']);

        if (is_array($allowedStudentIds)) {
            if (empty($allowedStudentIds)) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 50,
                    'total' => 0,
                ]);
            }

            $q->whereIn('student_id', $allowedStudentIds);
        }

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('sender_role')) {
            $q->where('sender_role', $request->sender_role);
        }

        if ($request->filled('is_read')) {
            $q->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        return $q->orderByDesc('created_at')->paginate(50);
    }

    public function threads(Request $request)
    {
        $allowedStudentIds = $this->resolveAllowedStudentIds($request);
        $viewerProfile = $request->user()?->loadMissing('profile')?->profile;

        if (is_array($allowedStudentIds) && empty($allowedStudentIds)) {
            return response()->json(['data' => []]);
        }

        $messages = Message::query()
            ->with(['student.section.gradeLevel', 'sender'])
            ->when(is_array($allowedStudentIds), fn ($query) => $query->whereIn('student_id', $allowedStudentIds))
            ->when($request->filled('student_id'), fn ($query) => $query->where('student_id', $request->string('student_id')))
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('student_id');

        $threads = $messages->map(function (Collection $threadMessages, string $studentId) use ($viewerProfile) {
            /** @var \App\Models\Message $latestMessage */
            $latestMessage = $threadMessages->first();
            $student = $latestMessage->student;

            return [
                'student_id' => $studentId,
                'student' => $student ? [
                    'id' => $student->id,
                    'student_code' => $student->student_code,
                    'full_name' => $student->full_name,
                    'section' => $student->section ? [
                        'id' => $student->section->id,
                        'section_letter' => $student->section->section_letter,
                        'grade_level' => $student->section->gradeLevel ? [
                            'id' => $student->section->gradeLevel->id,
                            'name' => $student->section->gradeLevel->name,
                        ] : null,
                    ] : null,
                ] : null,
                'last_message' => [
                    'id' => $latestMessage->id,
                    'content' => $latestMessage->content,
                    'sender_role' => $latestMessage->sender_role,
                    'sender_id' => $latestMessage->sender_id,
                    'created_at' => $latestMessage->created_at,
                    'sender' => $latestMessage->sender ? [
                        'id' => $latestMessage->sender->id,
                        'full_name' => $latestMessage->sender->full_name,
                        'user_id' => $latestMessage->sender->user_id,
                    ] : null,
                ],
                'last_message_at' => $latestMessage->created_at,
                'last_message_preview' => str($latestMessage->content)->limit(140)->value(),
                'last_sender_role' => $latestMessage->sender_role,
                'total_messages' => $threadMessages->count(),
                'unread_count' => $threadMessages
                    ->where('is_read', false)
                    ->filter(fn (Message $message) => $message->sender_id !== $viewerProfile?->id)
                    ->count(),
            ];
        })->sortByDesc(function (array $thread) {
            return sprintf(
                '%08d-%s',
                (int) $thread['unread_count'],
                optional($thread['last_message_at'])->format('YmdHis')
            );
        })->values();

        return response()->json(['data' => $threads]);
    }

    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $user = $request->user()?->loadMissing('profile');
        $profile = $user?->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'El usuario autenticado no tiene un perfil asociado para enviar mensajes.',
            ], 422);
        }

        $allowedStudentIds = $this->resolveAllowedStudentIds($request);
        if (is_array($allowedStudentIds) && !in_array($data['student_id'], $allowedStudentIds, true)) {
            return response()->json([
                'message' => 'No tienes permiso para enviar mensajes a este estudiante.',
            ], 403);
        }

        $category = $data['category'] ?? 'general';

        $data['sender_role'] = $this->resolvePersistedSenderRole((string) ($profile->role ?? 'admin'));
        $data['sender_id'] = $profile->id;
        $data['is_read'] = false;
        $data['category'] = $category;
        $data['created_at'] = now();

        $message = Message::create($data);
        $message->load(['student', 'sender']);

        if ($category === 'tutoria') {
            $this->createTutoriaRecipients($message);
            $this->dispatchTutoriaNotifications($request, $message);
        } else {
            $this->dispatchNotificationsForMessage($request, $message);
        }

        return response()->json($message, 201);
    }

    // GET /api/messages/{message}/recipient-read
    // Marca como leida la fila de message_recipients del usuario autenticado
    // para este mensaje (lectura independiente por destinatario, no toca
    // messages.is_read que sigue siendo el estado compartido del hilo).
    public function markRecipientRead(Request $request, Message $message)
    {
        $recipient = MessageRecipient::query()
            ->where('message_id', $message->id)
            ->where('recipient_user_id', (string) $request->user()->id)
            ->first();

        if (!$recipient) {
            return response()->json(['message' => 'No eres destinatario de este mensaje.'], 403);
        }

        if (!$recipient->read_at) {
            $recipient->update(['read_at' => now()]);
        }

        return response()->json($recipient);
    }

    private function studentInbox(Request $request)
    {
        $studentId = Student::query()
            ->where('user_id', (string) $request->user()->id)
            ->value('id');

        if (!$studentId) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 50,
                'total' => 0,
            ]);
        }

        $recipientUserId = (string) $request->user()->id;

        $q = Message::with(['student', 'sender', 'recipients' => function ($query) use ($recipientUserId) {
            $query->where('recipient_type', 'student')->where('recipient_user_id', $recipientUserId);
        }])
            ->whereExists(function ($sub) use ($recipientUserId) {
                $sub->selectRaw('1')
                    ->from('message_recipients as mr')
                    ->whereColumn('mr.message_id', 'messages.id')
                    ->where('mr.recipient_type', 'student')
                    ->where('mr.recipient_user_id', $recipientUserId);
            });

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->string('student_id'));
        }

        return response()->json(
            $q->orderByDesc('created_at')->paginate(50)
        );
    }

    private function createTutoriaRecipients(Message $message): void
    {
        $student = Student::query()->find($message->student_id);

        if ($student?->user_id) {
            MessageRecipient::create([
                'message_id' => $message->id,
                'recipient_type' => 'student',
                'recipient_user_id' => $student->user_id,
                'created_at' => now(),
            ]);
        }

        if ($student) {
            $student->guardians()
                ->whereNotNull('guardians.user_id')
                ->get()
                ->unique('user_id')
                ->each(function ($guardian) use ($message) {
                    MessageRecipient::create([
                        'message_id' => $message->id,
                        'recipient_type' => 'guardian',
                        'recipient_user_id' => $guardian->user_id,
                        'created_at' => now(),
                    ]);
                });
        }
    }

    private function dispatchTutoriaNotifications(Request $request, Message $message): void
    {
        $senderUserId = (string) $request->user()->id;

        $recipients = MessageRecipient::query()
            ->where('message_id', $message->id)
            ->get(['recipient_type', 'recipient_user_id'])
            ->filter(fn (MessageRecipient $recipient) => (string) $recipient->recipient_user_id !== $senderUserId)
            ->unique('recipient_user_id');

        $notificationColumns = [
            'title' => Schema::hasColumn('notifications', 'title'),
            'message' => Schema::hasColumn('notifications', 'message'),
            'data' => Schema::hasColumn('notifications', 'data'),
            'link' => Schema::hasColumn('notifications', 'link'),
            'created_by' => Schema::hasColumn('notifications', 'created_by'),
        ];

        $recipients->each(function (MessageRecipient $recipient) use ($request, $message, $notificationColumns) {
            $link = $recipient->recipient_type === 'student' ? '/app/student/tutoria' : '/app/messages/apoderado';

            $payload = [
                'user_id' => (string) $recipient->recipient_user_id,
                'type' => 'tutoria_registrada',
                'status' => 'no_leida',
            ];

            if ($notificationColumns['title']) {
                $payload['title'] = $message->title ?: 'Nuevo mensaje de tutoría académica';
            }

            if ($notificationColumns['message']) {
                $payload['message'] = Str::limit($message->content, 140);
            }

            if ($notificationColumns['data']) {
                $payload['data'] = [
                    'message_id' => $message->id,
                    'student_id' => $message->student_id,
                ];
            }

            if ($notificationColumns['link']) {
                $payload['link'] = $link;
            }

            if ($notificationColumns['created_by']) {
                $payload['created_by'] = (string) $request->user()->id;
            }

            Notification::create($payload);
        });
    }

    public function show(Request $request, Message $message)
    {
        if (!$this->canAccessStudent($request, (string) $message->student_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $message->load(['student', 'sender']);
    }

    public function update(UpdateMessageRequest $request, Message $message)
    {
        if (!$this->canAccessStudent($request, (string) $message->student_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->update($request->validated());

        return $message->load(['student', 'sender']);
    }

    public function destroy(Request $request, Message $message)
    {
        if (!$this->canAccessStudent($request, (string) $message->student_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->delete();
        return response()->noContent();
    }

    private function resolveAllowedStudentIds(Request $request): ?array
    {
        $role = $request->user()?->profile?->role;

        if (!$role || in_array($role, ['admin', 'director', 'coordinator', 'secretary'], true)) {
            return null;
        }

        if ($role === 'teacher') {
            $teacherId = Teacher::query()
                ->where('user_id', (string) $request->user()->id)
                ->value('id');

            if (!$teacherId) {
                return [];
            }

            return DB::table('student_course_enrollments as sce')
                ->join('teacher_course_assignments as tca', function ($join) use ($teacherId) {
                    $join->on('tca.course_id', '=', 'sce.course_id')
                        ->on('tca.section_id', '=', 'sce.section_id')
                        ->on('tca.academic_year_id', '=', 'sce.academic_year_id')
                        ->where('tca.teacher_id', '=', $teacherId)
                        ->where('tca.is_active', '=', true);
                })
                ->when($request->filled('course_id'), fn ($query) => $query->where('sce.course_id', $request->string('course_id')))
                ->when($request->filled('section_id'), fn ($query) => $query->where('sce.section_id', $request->string('section_id')))
                ->when($request->filled('academic_year_id'), fn ($query) => $query->where('sce.academic_year_id', $request->string('academic_year_id')))
                ->where('sce.status', 'active')
                ->distinct()
                ->pluck('sce.student_id')
                ->map(fn ($studentId) => (string) $studentId)
                ->values()
                ->all();
        }

        if ($role === 'guardian') {
            return DB::table('student_guardians as sg')
                ->join('guardians as g', 'g.id', '=', 'sg.guardian_id')
                ->where('g.user_id', (string) $request->user()->id)
                ->distinct()
                ->pluck('sg.student_id')
                ->map(fn ($studentId) => (string) $studentId)
                ->values()
                ->all();
        }

        return [];
    }

    private function canAccessStudent(Request $request, string $studentId): bool
    {
        $allowedStudentIds = $this->resolveAllowedStudentIds($request);

        if (!is_array($allowedStudentIds)) {
            return true;
        }

        return in_array($studentId, $allowedStudentIds, true);
    }

    private function dispatchNotificationsForMessage(Request $request, Message $message): void
    {
        $senderRole = (string) $message->sender_role;
        $senderUserId = (string) $request->user()->id;
        $recipientUserIds = collect();
        $link = '/app/messages/teacher';
        $type = 'comunicado_nuevo';
        $notificationColumns = [
            'title' => Schema::hasColumn('notifications', 'title'),
            'message' => Schema::hasColumn('notifications', 'message'),
            'data' => Schema::hasColumn('notifications', 'data'),
            'link' => Schema::hasColumn('notifications', 'link'),
            'created_by' => Schema::hasColumn('notifications', 'created_by'),
        ];

        if ($senderRole === 'guardian') {
            $link = '/app/messages/teacher';
            $recipientUserIds = DB::table('student_course_enrollments as sce')
                ->join('teacher_course_assignments as tca', function ($join) {
                    $join->on('tca.course_id', '=', 'sce.course_id')
                        ->on('tca.section_id', '=', 'sce.section_id')
                        ->on('tca.academic_year_id', '=', 'sce.academic_year_id')
                        ->where('tca.is_active', '=', true);
                })
                ->join('teachers as t', 't.id', '=', 'tca.teacher_id')
                ->where('sce.student_id', (string) $message->student_id)
                ->where('sce.status', 'active')
                ->whereNotNull('t.user_id')
                ->distinct()
                ->pluck('t.user_id');
        } else {
            $link = '/app/messages/apoderado';
            $recipientUserIds = DB::table('student_guardians as sg')
                ->join('guardians as g', 'g.id', '=', 'sg.guardian_id')
                ->where('sg.student_id', (string) $message->student_id)
                ->whereNotNull('g.user_id')
                ->distinct()
                ->pluck('g.user_id');
        }

        $recipientUserIds
            ->map(fn ($userId) => (string) $userId)
            ->filter(fn (string $userId) => $userId !== $senderUserId)
            ->unique()
            ->each(function (string $userId) use ($request, $message, $type, $link, $notificationColumns) {
                $payload = [
                    'user_id' => $userId,
                    'type' => $type,
                    'status' => 'no_leida',
                ];

                if ($notificationColumns['title']) {
                    $payload['title'] = 'Nuevo mensaje';
                }

                if ($notificationColumns['message']) {
                    $payload['message'] = 'Tienes un nuevo mensaje sobre ' . ($message->student?->full_name ?? 'un estudiante') . '.';
                }

                if ($notificationColumns['data']) {
                    $payload['data'] = [
                        'message_id' => $message->id,
                        'student_id' => $message->student_id,
                    ];
                }

                if ($notificationColumns['link']) {
                    $payload['link'] = $link;
                }

                if ($notificationColumns['created_by']) {
                    $payload['created_by'] = (string) $request->user()->id;
                }

                Notification::create($payload);
            });
    }

    private function resolvePersistedSenderRole(string $role): string
    {
        return $role === 'guardian' ? 'guardian' : 'teacher';
    }
}
