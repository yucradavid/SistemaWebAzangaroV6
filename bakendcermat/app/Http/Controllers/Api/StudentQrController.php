<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QrRegenerationLog;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StudentQrController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'required|uuid|exists:students,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'level' => 'nullable|string',
            'all' => 'nullable|boolean',
        ]);

        $query = Student::query()->whereNull('attendance_qr_code');

        if (!empty($validated['student_ids'])) {
            $query->whereIn('id', $validated['student_ids']);
        } elseif (!empty($validated['section_id'])) {
            $query->where('section_id', $validated['section_id']);
        } elseif (!empty($validated['grade_level_id'])) {
            $query->whereHas('section', fn ($q) => $q->where('grade_level_id', $validated['grade_level_id']));
        } elseif (!empty($validated['level'])) {
            $query->whereHas('section.gradeLevel', fn ($q) => $q->where('level', $validated['level']));
        } elseif (!($validated['all'] ?? false)) {
            throw ValidationException::withMessages([
                'scope' => 'Debes indicar student_ids, section_id, grade_level_id, level o all=true.',
            ]);
        }

        $students = $query->get();

        $generated = 0;
        $skipped = 0;

        foreach ($students as $student) {
            if (!empty($student->attendance_qr_code)) {
                $skipped++;
                continue;
            }
            $student->update(['attendance_qr_code' => $student->student_code]);
            $generated++;
        }

        return response()->json([
            'message' => "QR generado para {$generated} estudiantes. {$skipped} ya tenian codigo.",
            'generated' => $generated,
            'skipped' => $skipped,
        ]);
    }

    public function regeneratePreview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'required|uuid|exists:students,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'level' => 'nullable|string',
            'all' => 'nullable|boolean',
        ]);

        $query = Student::query();

        if (!empty($validated['student_ids'])) {
            $query->whereIn('id', $validated['student_ids']);
        } elseif (!empty($validated['section_id'])) {
            $query->where('section_id', $validated['section_id']);
        } elseif (!empty($validated['grade_level_id'])) {
            $query->whereHas('section', fn ($q) => $q->where('grade_level_id', $validated['grade_level_id']));
        } elseif (!empty($validated['level'])) {
            $query->whereHas('section.gradeLevel', fn ($q) => $q->where('level', $validated['level']));
        } elseif ($validated['all'] ?? false) {
            // Sin filtros adicionales
        } else {
            throw ValidationException::withMessages([
                'scope' => 'Debes indicar student_ids, section_id, grade_level_id, level o all=true.',
            ]);
        }

        $total = $query->count();
        $withQr = (clone $query)->whereNotNull('attendance_qr_code')->count();
        $withoutQr = $total - $withQr;

        return response()->json([
            'total' => $total,
            'with_qr' => $withQr,
            'without_qr' => $withoutQr,
            'will_regenerate' => $withQr,
        ]);
    }

    public function regenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:500',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'required|uuid|exists:students,id',
            'section_id' => 'nullable|uuid|exists:sections,id',
            'grade_level_id' => 'nullable|uuid|exists:grade_levels,id',
            'level' => 'nullable|string',
            'all' => 'nullable|boolean',
            'confirm_all' => 'nullable|boolean',
        ]);

        $query = Student::query();

        if (!empty($validated['student_ids'])) {
            $query->whereIn('id', $validated['student_ids']);
        } elseif (!empty($validated['section_id'])) {
            $query->where('section_id', $validated['section_id']);
        } elseif (!empty($validated['grade_level_id'])) {
            $query->whereHas('section', fn ($q) => $q->where('grade_level_id', $validated['grade_level_id']));
        } elseif (!empty($validated['level'])) {
            $query->whereHas('section.gradeLevel', fn ($q) => $q->where('level', $validated['level']));
        } elseif ($validated['all'] ?? false) {
            if (!($validated['confirm_all'] ?? false)) {
                throw ValidationException::withMessages([
                    'confirm_all' => 'Debes confirmar con confirm_all=true para regenerar todo el colegio.',
                ]);
            }
        } else {
            throw ValidationException::withMessages([
                'scope' => 'Debes indicar student_ids, section_id, grade_level_id, level o all=true.',
            ]);
        }

        $students = $query->get();
        $regenerated = 0;

        foreach ($students as $student) {
            $oldCode = $student->attendance_qr_code;
            $newCode = strtoupper(Str::random(12));

            // Asegurar unicidad del nuevo codigo
            while (Student::where('attendance_qr_code', $newCode)->where('id', '!=', $student->id)->exists()) {
                $newCode = strtoupper(Str::random(12));
            }

            $student->update(['attendance_qr_code' => $newCode]);

            QrRegenerationLog::create([
                'student_id' => $student->id,
                'old_code' => $oldCode,
                'new_code' => $newCode,
                'reason' => $validated['reason'],
                'performed_by' => (string) $request->user()->id,
            ]);

            $regenerated++;
        }

        return response()->json([
            'message' => "QR regenerado para {$regenerated} estudiantes.",
            'regenerated' => $regenerated,
        ]);
    }

    public function carnet(Request $request, string $studentId): JsonResponse
    {
        $student = Student::with(['section.gradeLevel', 'guardians'])
            ->where('id', $studentId)
            ->firstOrFail();

        $qrCode = $student->attendance_qr_code ?? $student->student_code;
        $section = $student->section;
        $gradeLevel = $section?->gradeLevel;
        $gradeLabel = $gradeLevel ? $gradeLevel->level . ' ' . $gradeLevel->grade : '-';
        $sectionLabel = $section ? $section->section_letter : '-';

        $html = '<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Carnet - ' . e($student->full_name) . '</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
.carnet { width: 340px; background: #fff; border: 2px solid #1a237e; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.carnet-header { background: #1a237e; color: #fff; text-align: center; padding: 12px 16px; }
.carnet-header h2 { font-size: 14px; margin-bottom: 2px; }
.carnet-header p { font-size: 10px; opacity: 0.85; }
.carnet-body { padding: 16px; text-align: center; }
.carnet-body .photo-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #e8eaf6; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #1a237e; font-weight: bold; }
.carnet-body .student-name { font-size: 16px; font-weight: bold; color: #1a237e; margin-bottom: 4px; }
.carnet-body .student-dni { font-size: 11px; color: #666; margin-bottom: 8px; }
.carnet-body .student-info { font-size: 11px; color: #333; margin-bottom: 12px; }
.carnet-body .qr-box { display: inline-block; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; }
.carnet-body .qr-code { font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #1a237e; }
.carnet-footer { font-size: 9px; color: #999; text-align: center; padding: 8px 16px; border-top: 1px solid #eee; }
@media print { body { background: none; padding: 0; } .carnet { box-shadow: none; } }
</style>
</head>
<body>
<div class="carnet">
  <div class="carnet-header">
    <h2>IE Carmenato de Azangaro</h2>
    <p>Carnet de Estudiante</p>
  </div>
  <div class="carnet-body">
    <div class="photo-placeholder">' . e(mb_substr($student->first_name, 0, 1)) . e(mb_substr($student->last_name ?? '', 0, 1)) . '</div>
    <div class="student-name">' . e($student->full_name) . '</div>
    <div class="student-dni">DNI: ' . e($student->dni ?? '-') . '</div>
    <div class="student-info">' . e($gradeLabel) . ' - Seccion ' . e($sectionLabel) . '</div>
    <div class="qr-box">
      <div class="qr-code">' . e($qrCode) . '</div>
    </div>
    <div class="student-info">Codigo: ' . e($student->student_code) . '</div>
  </div>
  <div class="carnet-footer">Sistema CERMAT - Documento generado automaticamente</div>
</div>
</body>
</html>';

        return response()->json([
            'html' => $html,
            'student' => [
                'id' => (string) $student->id,
                'full_name' => $student->full_name,
                'student_code' => $student->student_code,
                'qr_code' => $qrCode,
            ],
        ]);
    }
}
