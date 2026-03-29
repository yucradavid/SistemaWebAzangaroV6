<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $q = AuditLog::with('user');

        if ($request->filled('user_id')) {
            $q->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $q->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $q->where('entity_type', $request->entity_type);
        }

        if ($request->filled('entity_id')) {
            $q->where('entity_id', $request->entity_id);
        }

        return $q->orderByDesc('created_at')->paginate(100);
    }

    public function show(AuditLog $auditLog)
    {
        return $auditLog->load('user');
    }
}
