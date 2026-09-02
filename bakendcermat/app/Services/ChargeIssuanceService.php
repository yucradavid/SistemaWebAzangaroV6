<?php

namespace App\Services;

use App\Models\Charge;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unico lugar donde se construye y se emite un cargo.
 *
 * Antes esta logica vivia como metodos privados de ChargeController y solo la
 * podia usar la emision masiva. Al aparecer un segundo emisor (la aprobacion de
 * matricula, que genera los cargos de matricula y pension del alumno recien
 * matriculado) se extrajo aqui para que exista UNA sola definicion de "cargo
 * duplicado" y una sola forma de resolver el actor; si divergieran, la emision
 * masiva y la aprobacion podrian generar cargos incompatibles entre si.
 *
 * El comportamiento es exactamente el que tenia ChargeController: este servicio
 * no agrega ni quita reglas, solo las centraliza.
 */
class ChargeIssuanceService
{
    /**
     * Emite un cargo solo si el alumno no tiene ya uno vigente equivalente.
     * Devuelve null si ya existia (no es un error: es la corrida repetida).
     *
     * La duplicidad se define por la obligacion real (mismo alumno, anio,
     * concepto y fecha de vencimiento), no por el texto de notes: dos corridas
     * pueden generar el mismo cargo con notas distintas (ej. nombre de plan
     * cambiado) y notes no debe permitir que se dupliquen. Se excluyen los
     * cargos anulados porque uno anulado ya no representa una obligacion
     * vigente y debe poder regenerarse.
     */
    public function issueIfAbsent(array $data): ?Charge
    {
        if ($this->activeChargeExists(
            (string) $data['student_id'],
            (string) $data['academic_year_id'],
            $data['concept_id'] ?? null,
            $data['due_date'] ?? null
        )) {
            return null;
        }

        try {
            return $this->create($data);
        } catch (QueryException $e) {
            // 23505: el indice unico parcial charges_unique_active_charge gano
            // la carrera (dos emisiones simultaneas). El resultado deseado ya
            // se cumplio: el cargo existe.
            if ($e->getCode() === '23505') {
                return null;
            }

            throw $e;
        }
    }

    /**
     * Crea el cargo sin verificar duplicados previos. La QueryException 23505
     * se propaga: quien llama decide como responder (ChargeController::store
     * la traduce a un 422 con mensaje al usuario).
     */
    public function create(array $data): Charge
    {
        return Charge::create($this->buildChargeInsert($data));
    }

    public function activeChargeExists(
        string $studentId,
        string $academicYearId,
        ?string $conceptId,
        $dueDate
    ): bool {
        return Charge::query()
            ->where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->where('concept_id', $conceptId)
            ->whereDate('due_date', $dueDate)
            ->whereNull('voided_at')
            ->exists();
    }

    public function buildChargeInsert(array $data): array
    {
        $amount = (float) ($data['amount'] ?? 0);
        $discountAmount = min((float) ($data['discount_amount'] ?? 0), $amount);
        $payload = [
            'student_id' => $data['student_id'],
            'academic_year_id' => $data['academic_year_id'],
            'concept_id' => $data['concept_id'] ?? null,
            'type' => $data['type'],
            'status' => $data['status'] ?? 'pendiente',
            'amount' => $amount,
            'due_date' => $data['due_date'] ?? null,
            'created_by' => $data['created_by'] ?? null,
        ];

        $this->fillChargeNoteFields($payload, $data['notes'] ?? null);

        if (Schema::hasColumn('charges', 'discount_amount')) {
            $payload['discount_amount'] = $discountAmount;
        } else {
            $payload['discount'] = $discountAmount;
        }

        if (Schema::hasColumn('charges', 'paid_amount')) {
            $payload['paid_amount'] = (float) ($data['paid_amount'] ?? 0);
        }

        if (Schema::hasColumn('charges', 'final_amount')) {
            $payload['final_amount'] = max(0, $amount - $discountAmount);
        }

        return $payload;
    }

    public function fillChargeNoteFields(array &$payload, ?string $notes): void
    {
        $noteValue = filled($notes) ? trim($notes) : 'Cargo financiero';

        if (Schema::hasColumn('charges', 'notes')) {
            $payload['notes'] = $noteValue;
        }

        if (Schema::hasColumn('charges', 'description')) {
            $payload['description'] = $noteValue;
        }
    }

    public function supportsCreatedBy(): bool
    {
        return Schema::hasColumn('charges', 'created_by');
    }

    /**
     * charges.created_by (y voided_by) referencian public.users.id. El usuario
     * autenticado por Sanctum ES la fila de public.users, por lo que su clave
     * primaria es el valor correcto. NO se debe usar el id de auth.users: vive
     * en otro espacio de ids y provoca violacion de FK (charges_created_by_fkey).
     *
     * Recibe el usuario y no el Request para que tambien lo puedan usar los
     * comandos de consola y los servicios, que no tienen Request.
     */
    public function resolveActorUserId(?Authenticatable $authUser): ?string
    {
        if (! $authUser) {
            return null;
        }

        $candidateIds = array_values(array_filter([
            $authUser->getKey(),
            $authUser->id ?? null,
            $authUser->profile?->user_id ?? null,
        ]));

        foreach ($candidateIds as $candidateId) {
            $candidateId = (string) $candidateId;

            if ($candidateId !== '' && DB::table('users')->where('id', $candidateId)->exists()) {
                return $candidateId;
            }
        }

        // Fallback: ubicar al usuario en public.users por correo.
        $emailCandidates = array_values(array_filter([
            $authUser->email ?? null,
            $authUser->profile?->email ?? null,
        ]));

        foreach ($emailCandidates as $email) {
            $publicUserId = DB::table('users')
                ->whereRaw('lower(email) = ?', [strtolower((string) $email)])
                ->value('id');

            if ($publicUserId) {
                return (string) $publicUserId;
            }
        }

        return null;
    }
}
