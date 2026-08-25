<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    // GET /api/system-settings/max-courses-per-teacher
    public function getMaxCoursesPerTeacher()
    {
        $setting = SystemSetting::query()->where('key', 'max_courses_per_teacher')->first();

        return response()->json([
            'key' => 'max_courses_per_teacher',
            'value' => (int) ($setting->value ?? 6),
            'description' => $setting->description ?? null,
        ]);
    }

    // PUT /api/system-settings/max-courses-per-teacher
    public function updateMaxCoursesPerTeacher(Request $request)
    {
        $data = $request->validate([
            'value' => ['required', 'integer', 'min:1'],
        ], [
            'value.min' => 'El limite de cursos por docente debe ser mayor a 0.',
        ]);

        $setting = SystemSetting::query()->updateOrCreate(
            ['key' => 'max_courses_per_teacher'],
            [
                'value' => (string) $data['value'],
                'description' => 'Maximo de cursos que puede dictar un docente simultaneamente',
            ]
        );

        return response()->json([
            'message' => 'Limite de cursos por docente actualizado',
            'key' => 'max_courses_per_teacher',
            'value' => (int) $setting->value,
        ]);
    }

    // GET /api/system-settings/taller-tolerance-minutes
    public function getTallerToleranceMinutes()
    {
        $setting = SystemSetting::query()->where('key', 'taller_tolerance_minutes')->first();

        return response()->json([
            'key' => 'taller_tolerance_minutes',
            'value' => (int) ($setting->value ?? 30),
            'description' => $setting->description ?? null,
        ]);
    }

    // PUT /api/system-settings/taller-tolerance-minutes
    public function updateTallerToleranceMinutes(Request $request)
    {
        $data = $request->validate([
            'value' => ['required', 'integer', 'min:0'],
        ], [
            'value.min' => 'La tolerancia de taller debe ser mayor o igual a 0.',
        ]);

        $setting = SystemSetting::query()->updateOrCreate(
            ['key' => 'taller_tolerance_minutes'],
            [
                'value' => (string) $data['value'],
                'description' => 'Minutos de tolerancia despues de finalizar taller/banda, para la hora limite de salida',
            ]
        );

        return response()->json([
            'message' => 'Tolerancia de taller actualizada',
            'key' => 'taller_tolerance_minutes',
            'value' => (int) $setting->value,
        ]);
    }
}
