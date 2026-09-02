<?php

namespace App\Services;

use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Aviso automatico e institucional a los apoderados de un alumno: notificacion
 * en el portal + mensaje en su buzon.
 *
 * Nacio para los avisos de asistencia, donde los dos emisores -el comando
 * attendance:mark-absences y el checkpoint QR de
 * AttendanceCheckpointController- tenian el MISMO codigo duplicado y el MISMO
 * bug: creaban el Message con sender_role='system' y sender_id=null, cuando
 * messages.sender_id es NOT NULL y messages_sender_role_check solo admite
 * 'teacher' o 'guardian'. Cualquiera de los dos reventaba con 23502 en cuanto
 * un apoderado con cuenta necesitaba ser notificado.
 *
 * Se generalizo al aparecer un tercer emisor (el recordatorio de cuota por
 * vencer), que necesita lo mismo con otra categoria y otro tipo. La categoria
 * y el tipo son parametros justamente para que no vuelva a haber tres copias
 * de esta logica.
 *
 * Se sigue el patron ya construido para Escuela Vacacional
 * (AcademicEvaluationService::dispatchVacationalNotifications), que si respeta
 * los constraints: se resuelve un Profile emisor real y el rol se normaliza a
 * 'teacher', porque el aviso es institucional y no existe un rol 'system' en
 * el esquema.
 */
class GuardianNoticeService
{
    private ?Profile $senderProfile = null;

    private bool $senderResolved = false;

    /**
     * Notifica a los apoderados con cuenta de un alumno.
     *
     * @return int Cantidad de apoderados notificados.
     */
    public function notifyGuardians(
        Student $student,
        string $title,
        string $message,
        string $category,
        string $notificationType,
        string $relatedEntityType = 'student',
        ?string $relatedEntityId = null
    ): int {
        $relatedEntityId ??= $student->id;

        $guardians = $student->guardians()
            ->whereNotNull('guardians.user_id')
            ->get()
            ->unique('user_id');

        if ($guardians->isEmpty()) {
            return 0;
        }

        $sender = $this->resolveSenderProfile();
        $notified = 0;

        foreach ($guardians as $guardian) {
            // La notificacion del portal se crea siempre: no depende de que
            // exista un profile emisor y es la alerta que el apoderado ve.
            Notification::create([
                'user_id' => $guardian->user_id,
                'type' => $notificationType,
                'title' => $title,
                'message' => $message,
                'status' => 'no_leida',
                'related_entity_type' => $relatedEntityType,
                'related_entity_id' => $relatedEntityId,
            ]);

            // El mensaje del buzon si necesita emisor: messages.sender_id es
            // NOT NULL y apunta a profiles. Sin emisor se omite el mensaje (no
            // se rompe el aviso completo) y queda el rastro en el log.
            if (! $sender) {
                $notified++;

                continue;
            }

            $payload = [
                'student_id' => $student->id,
                // El constraint solo admite 'teacher'/'guardian'; mismo criterio
                // de normalizacion que MessageController::resolvePersistedSenderRole.
                'sender_role' => 'teacher',
                'sender_id' => $sender->id,
                'content' => $message,
                'is_read' => false,
                'category' => $category,
            ];

            if (Schema::hasColumn('messages', 'title')) {
                $payload['title'] = $title;
            }

            $msg = Message::create($payload);

            MessageRecipient::create([
                'message_id' => $msg->id,
                'recipient_type' => 'guardian',
                'recipient_user_id' => $guardian->user_id,
                'created_at' => now(),
            ]);

            $notified++;
        }

        return $notified;
    }

    /**
     * Emisor institucional de los avisos automaticos: el primer profile con rol
     * admin o director. Es lo mas cercano a "el colegio" dentro de un esquema
     * que no tiene un rol 'system'.
     *
     * Se resuelve una sola vez por instancia: el comando de faltas puede
     * notificar a cientos de alumnos en una corrida y no tiene sentido repetir
     * la consulta por cada uno.
     */
    private function resolveSenderProfile(): ?Profile
    {
        if ($this->senderResolved) {
            return $this->senderProfile;
        }

        $this->senderResolved = true;

        $this->senderProfile = Profile::query()
            ->whereIn('role', ['admin', 'director'])
            ->orderByRaw("CASE WHEN role = 'director' THEN 0 ELSE 1 END")
            ->orderBy('created_at')
            ->first();

        if (! $this->senderProfile) {
            Log::warning('GuardianNoticeService: no hay ningun profile admin/director para figurar como emisor; se envian las notificaciones del portal pero no los mensajes del buzon.');
        }

        return $this->senderProfile;
    }
}
