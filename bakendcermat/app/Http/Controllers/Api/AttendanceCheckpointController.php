<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceDailyRecord;
use App\Models\AttendanceScheduleConfig;
use App\Models\Guardian;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notification;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentExtracurricularActivity;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceCheckpointController extends Controller
{
    public function studentCheckpoint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string|min:1|max:100',
            'checkpoint' => 'required|string|in:entrada,salida',
            'date' => 'nullable|string|date_format:Y-m-d',
        ]);

        $student = Student::with(['section.gradeLevel'])
            ->where('attendance_qr_code', $validated['qr_code'])
            ->orWhere('student_code', $validated['qr_code'])
            ->first();

        if (!$student) {
            throw ValidationException::withMessages([
                'qr_code' => 'No se encontro un estudiante con este codigo.',
            ]);
        }

        if ($student->status !== 'active') {
            throw ValidationException::withMessages([
                'student' => 'El estudiante no esta activo.',
            ]);
        }

        $section = $student->section;
        if (!$section) {
            throw ValidationException::withMessages([
                'student' => 'El estudiante no tiene seccion asignada.',
            ]);
        }

        $shift = $section->shift;
        if (!$shift) {
            throw ValidationException::withMessages([
                'section' => 'La seccion del estudiante no tiene turno asignado.',
            ]);
        }

        $checkpoint = $validated['checkpoint'];
        $date = $validated['date'] ?? now()->toDateString();

        $config = AttendanceScheduleConfig::query()
            ->where('shift', $shift)
            ->where('checkpoint_type', $checkpoint)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            throw ValidationException::withMessages([
                'config' => "No hay configuracion de horario para turno {$shift}, checkpoint {$checkpoint}.",
            ]);
        }

        $now = Carbon::now();
        $currentTime = $now->format('H:i:s');

        $status = $this->calculateStatus($config, $currentTime, $checkpoint, $student, $section);

        $result = $this->storeCheckpoint(
            $student,
            $section,
            $date,
            $checkpoint,
            $status,
            $request->user()->id
        );

        if ($status === 'tarde') {
            $this->notifyGuardianTardiness($student, $section, $checkpoint, $date);
        }

        return response()->json([
            'message' => sprintf('Marcacion %s registrada: %s', $checkpoint, $status),
            'student' => [
                'id' => (string) $student->id,
                'full_name' => $student->full_name,
                'student_code' => $student->student_code,
            ],
            'status' => $status,
            'checkpoint' => $checkpoint,
            'date' => $date,
            'config' => [
                'shift' => $shift,
                'window_start' => $config->window_start,
                'late_after' => $config->late_after,
                'window_end' => $config->window_end,
            ],
        ]);
    }

    private function calculateStatus(
        AttendanceScheduleConfig $config,
        string $currentTime,
        string $checkpoint,
        Student $student,
        Section $section
    ): string {
        if ($checkpoint === 'entrada') {
            if ($currentTime <= $config->window_start) {
                return 'presente';
            }

            if ($config->late_after && $currentTime <= $config->late_after) {
                return 'presente';
            }

            if ($config->late_after && $currentTime > $config->late_after && $currentTime <= $config->window_end) {
                return 'tarde';
            }

            if ($currentTime > $config->window_end) {
                return 'tarde';
            }
        }

        if ($checkpoint === 'salida') {
            $tallerTolerance = SystemSetting::query()
                ->where('key', 'taller_tolerance_minutes')
                ->value('value');

            $toleranceMinutes = (int) ($tallerTolerance ?? 30);

            $isTallerStudent = StudentExtracurricularActivity::query()
                ->where('student_id', $student->id)
                ->where('is_active', true)
                ->exists();

            $windowEnd = $config->window_end;

            if ($isTallerStudent && $toleranceMinutes > 0) {
                $extendedEnd = Carbon::parse($config->window_end)->addMinutes($toleranceMinutes)->format('H:i:s');
                if ($currentTime <= $extendedEnd) {
                    return 'presente';
                }
            }

            if ($currentTime <= $windowEnd) {
                return 'presente';
            }
        }

        return 'presente';
    }

    private function storeCheckpoint(
        Student $student,
        Section $section,
        string $date,
        string $checkpoint,
        string $status,
        string $userId
    ): AttendanceDailyRecord {
        $academicYearId = $section->academic_year_id;

        $dailyRecord = AttendanceDailyRecord::query()->firstOrNew([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'academic_year_id' => $academicYearId,
            'date' => $date,
        ]);

        if ($checkpoint === 'entrada') {
            $dailyRecord->entry_status = $status;
            $dailyRecord->entry_marked_at = now();
            $dailyRecord->entry_source = 'qr_carnet';
        } else {
            $dailyRecord->exit_status = $status;
            $dailyRecord->exit_marked_at = now();
            $dailyRecord->exit_source = 'qr_carnet';
        }

        $dailyRecord->last_recorded_by_profile_id = $userId;
        $dailyRecord->save();

        return $dailyRecord;
    }

    private function notifyGuardianTardiness(
        Student $student,
        Section $section,
        string $checkpoint,
        string $date
    ): void {
        $guardians = Guardian::query()
            ->whereHas('students', fn ($q) => $q->where('students.id', $student->id))
            ->get();

        if ($guardians->isEmpty()) {
            return;
        }

        $gradeLevel = $section->gradeLevel;
        $gradeLabel = $gradeLevel ? $gradeLevel->level . ' ' . $gradeLevel->grade : '-';
        $sectionLabel = $section->section_letter;

        $title = 'Tardanza registrada';
        $message = sprintf(
            'El estudiante %s registro %s tardia el %s en %s %s - Seccion %s.',
            $student->full_name,
            $checkpoint,
            $date,
            $gradeLabel,
            $gradeLevel?->name ?? '',
            $sectionLabel
        );

        foreach ($guardians as $guardian) {
            if (!$guardian->user_id) {
                continue;
            }

            Notification::create([
                'user_id' => $guardian->user_id,
                'type' => 'asistencia_tardanza',
                'title' => $title,
                'message' => $message,
                'status' => 'no_leida',
                'related_entity_type' => 'student',
                'related_entity_id' => $student->id,
            ]);

            $msg = Message::create([
                'student_id' => $student->id,
                'sender_role' => 'system',
                'sender_id' => null,
                'content' => $message,
                'is_read' => false,
                'category' => 'asistencia',
                'title' => $title,
            ]);

            MessageRecipient::create([
                'message_id' => $msg->id,
                'recipient_type' => 'guardian',
                'recipient_user_id' => $guardian->user_id,
            ]);
        }
    }
}
