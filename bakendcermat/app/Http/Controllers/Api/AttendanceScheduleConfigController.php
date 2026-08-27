<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceScheduleConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceScheduleConfigController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => AttendanceScheduleConfig::query()
                ->orderBy('shift')
                ->orderBy('checkpoint_type')
                ->get(),
        ]);
    }

    public function update(Request $request, string $shift, string $checkpointType): JsonResponse
    {
        $input = $request->all();
        if (empty($input['late_after']) || $input['late_after'] === '') {
            $input['late_after'] = null;
        }

        // Los horarios guardados en BD vienen como HH:mm:ss (columna `time` de
        // Postgres); si el campo no fue tocado en el picker, el frontend reenvia
        // ese mismo formato. Normalizamos a HH:mm antes de validar para aceptar
        // ambos formatos sin rechazar el valor sin cambios.
        foreach (['window_start', 'late_after', 'window_end'] as $field) {
            if (!empty($input[$field]) && preg_match('/^(\d{2}:\d{2}):\d{2}$/', $input[$field], $m)) {
                $input[$field] = $m[1];
            }
        }

        $request->merge($input);

        $validated = $request->validate([
            'window_start' => 'required|date_format:H:i',
            'late_after' => 'nullable|date_format:H:i',
            'window_end' => 'required|date_format:H:i',
            'is_active' => 'boolean',
        ]);

        $config = AttendanceScheduleConfig::query()
            ->where('shift', $shift)
            ->where('checkpoint_type', $checkpointType)
            ->first();

        if (!$config) {
            return response()->json(['message' => 'Configuracion no encontrada para ese turno y checkpoint.'], 404);
        }

        $config->update([
            'window_start' => $validated['window_start'],
            'late_after' => $validated['late_after'] ?? null,
            'window_end' => $validated['window_end'],
            'is_active' => $validated['is_active'] ?? $config->is_active,
            'updated_by' => (string) $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Configuracion de horario actualizada.',
            'data' => $config->fresh(),
        ]);
    }
}
