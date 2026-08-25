<?php

namespace App\Console\Commands;

use App\Models\AttendanceDailyRecord;
use App\Models\AttendanceScheduleConfig;
use App\Models\Guardian;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notification;
use App\Models\Section;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Console\Command;

class MarkAbsences extends Command
{
    protected $signature = 'attendance:mark-absences {--date= : Fecha en formato Y-m-d (default: hoy)}';

    protected $description = 'Marca falta a estudiantes que no registraron checkpoint de entrada en su turno';

    public function handle(): int
    {
        $date = $this->option('date') ?? Carbon::now()->toDateString();

        $this->info("Procesando faltas para: {$date}");

        $configs = AttendanceScheduleConfig::query()
            ->where('checkpoint_type', 'entrada')
            ->where('is_active', true)
            ->get();

        $totalMarked = 0;

        foreach ($configs as $config) {
            $windowEnd = Carbon::parse($config->window_end);

            if (Carbon::now()->lessThan($windowEnd)) {
                $this->line("  Turno {$config->shift}: ventana de entrada aun abierta (hasta {$config->window_end}). Saltando.");
                continue;
            }

            $sections = Section::query()
                ->where('shift', $config->shift)
                ->whereNotNull('shift')
                ->get();

            foreach ($sections as $section) {
                $markedInSection = $this->processSection($section, $config, $date);
                $totalMarked += $markedInSection;
            }
        }

        $this->info("Total de faltas marcadas: {$totalMarked}");

        return Command::SUCCESS;
    }

    private function processSection(Section $section, AttendanceScheduleConfig $config, string $date): int
    {
        $enrolledStudentIds = DB::table('student_course_enrollments')
            ->where('section_id', $section->id)
            ->where('academic_year_id', $section->academic_year_id)
            ->where('status', 'active')
            ->pluck('student_id')
            ->unique()
            ->values()
            ->all();

        if (empty($enrolledStudentIds)) {
            return 0;
        }

        $studentsWithRecord = AttendanceDailyRecord::query()
            ->whereIn('student_id', $enrolledStudentIds)
            ->where('section_id', $section->id)
            ->where('academic_year_id', $section->academic_year_id)
            ->whereDate('date', $date)
            ->whereNotNull('entry_status')
            ->pluck('student_id')
            ->all();

        $studentsNeedingAbsence = array_diff($enrolledStudentIds, $studentsWithRecord);

        $marked = 0;

        foreach ($studentsNeedingAbsence as $studentId) {
            $student = Student::with(['section.gradeLevel'])->find($studentId);
            if (!$student || $student->status !== 'active') {
                continue;
            }

            $dailyRecord = AttendanceDailyRecord::query()->firstOrNew([
                'student_id' => $studentId,
                'section_id' => $section->id,
                'academic_year_id' => $section->academic_year_id,
                'date' => $date,
            ]);

            $dailyRecord->entry_status = 'falta';
            $dailyRecord->entry_note = 'No se registro checkpoint de entrada.';
            $dailyRecord->entry_marked_at = now();
            $dailyRecord->entry_source = 'auto_falta';
            $dailyRecord->save();

            $this->notifyGuardianAbsence($student, $section, $date);

            $marked++;
        }

        return $marked;
    }

    private function notifyGuardianAbsence(Student $student, Section $section, string $date): void
    {
        $guardians = Guardian::query()
            ->whereHas('students', fn ($q) => $q->where('students.id', $student->id))
            ->get();

        if ($guardians->isEmpty()) {
            return;
        }

        $gradeLevel = $section->gradeLevel;
        $gradeLabel = $gradeLevel ? $gradeLevel->level . ' ' . $gradeLevel->grade : '-';

        $title = 'Falta registrada';
        $message = sprintf(
            'El estudiante %s marco falta el %s en %s - Seccion %s. No registro asistencia.',
            $student->full_name,
            $date,
            $gradeLabel,
            $section->section_letter
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
