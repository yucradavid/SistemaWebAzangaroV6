<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNotificationRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $q = Notification::query()
            ->where('user_id', $user->id);

        // filtros
        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }

        return $q->orderByDesc('created_at')->paginate(30);
    }

    // Crear notificación (admin/sistema)
    public function store(StoreNotificationRequest $request)
    {
        $data = $request->validated();

        $data['status'] = $data['status'] ?? 'no_leida';

        // Si tu tabla tiene created_by, lo setea
        if (Schema::hasColumn('notifications', 'created_by')) {
            $data['created_by'] = $request->user()->id;
        }

        $notification = Notification::create($data);

        return response()->json($notification, 201);
    }

    public function show(Notification $notification, Request $request)
    {
        // seguridad: solo el dueño puede ver
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $notification;
    }

    // Marcar como leída
    public function markAsRead(Notification $notification, Request $request)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $update = [
            'status' => 'leida',
        ];

        // si existe read_at en tabla, setearlo
        if (Schema::hasColumn('notifications', 'read_at')) {
            $update['read_at'] = now();
        }

        $notification->update($update);

        return $notification->fresh();
    }

    // Marcar todas como leídas
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        $update = ['status' => 'leida'];

        if (Schema::hasColumn('notifications', 'read_at')) {
            $update['read_at'] = now();
        }

        Notification::where('user_id', $user->id)
            ->where('status', 'no_leida')
            ->update($update);

        return response()->json(['message' => 'Todas las notificaciones fueron marcadas como leídas.']);
    }

    public function destroy(Notification $notification, Request $request)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->delete();
        return response()->noContent();
    }
}
