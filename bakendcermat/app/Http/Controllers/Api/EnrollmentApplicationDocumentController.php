<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use App\Models\EnrollmentApplication;
use App\Models\EnrollmentApplicationDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EnrollmentApplicationDocumentController extends Controller
{
    // GET /admissions/applications/{application}/documents
    // Devuelve los document_types activos DEL NIVEL al que postula esta
    // solicitud (via grade_level.level), cruzados (left join) con lo que ya
    // se marco para ESA solicitud, para mostrar la lista completa con check/sin check.
    public function index(string $applicationId): JsonResponse
    {
        $application = EnrollmentApplication::with('gradeLevel')->find($applicationId);

        if (! $application) {
            return response()->json(['message' => 'Solicitud no encontrada.'], 404);
        }

        $documentTypes = DocumentType::query()
            ->where('is_active', true)
            ->where('level', $application->gradeLevel?->level)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        $deliveredByTypeId = EnrollmentApplicationDocument::query()
            ->where('enrollment_application_id', $applicationId)
            ->get()
            ->keyBy('document_type_id');

        $rows = $documentTypes->map(function (DocumentType $type) use ($deliveredByTypeId) {
            $existing = $deliveredByTypeId->get($type->id);

            return [
                'document_type_id' => $type->id,
                'name' => $type->name,
                'description' => $type->description,
                'is_required' => $type->is_required,
                'display_order' => $type->display_order,
                'delivered' => $existing?->delivered ?? false,
                'delivered_at' => $existing?->delivered_at,
                'notes' => $existing?->notes,
            ];
        });

        return response()->json([
            'data' => $rows,
            'observation' => $application->enrollment_observation,
        ]);
    }

    // PATCH /admissions/applications/{application}/documents/{documentType}
    // Toggle delivered = true/false, guarda delivered_at y updated_by.
    public function update(Request $request, string $applicationId, string $documentTypeId): JsonResponse
    {
        $application = EnrollmentApplication::find($applicationId);

        if (! $application) {
            return response()->json(['message' => 'Solicitud no encontrada.'], 404);
        }

        $documentType = DocumentType::find($documentTypeId);

        if (! $documentType) {
            return response()->json(['message' => 'Tipo de documento no encontrado.'], 404);
        }

        $validated = Validator::make($request->all(), [
            'delivered' => 'required|boolean',
            'notes' => 'nullable|string',
        ])->validate();

        $delivered = $validated['delivered'];

        $row = EnrollmentApplicationDocument::updateOrCreate(
            ['enrollment_application_id' => $applicationId, 'document_type_id' => $documentTypeId],
            [
                'delivered' => $delivered,
                'delivered_at' => $delivered ? now() : null,
                'notes' => $validated['notes'] ?? null,
                'updated_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'message' => $delivered ? 'Documento marcado como entregado.' : 'Documento marcado como pendiente.',
            'data' => $row,
        ]);
    }

    // PATCH /admissions/applications/{application}/enrollment-observation
    public function updateObservation(Request $request, string $applicationId): JsonResponse
    {
        $application = EnrollmentApplication::find($applicationId);

        if (! $application) {
            return response()->json(['message' => 'Solicitud no encontrada.'], 404);
        }

        $validated = Validator::make($request->all(), [
            'enrollment_observation' => 'nullable|string',
        ])->validate();

        $application->update(['enrollment_observation' => $validated['enrollment_observation'] ?? null]);

        return response()->json([
            'message' => 'Observacion guardada correctamente.',
            'data' => $application->fresh(),
        ]);
    }

    // GET /admissions/applications/{application}/documents-status
    // Endpoint auxiliar liviano para que el frontend decida si habilitar el
    // boton de aprobar, sin tener que traer el checklist completo.
    public function status(string $applicationId): JsonResponse
    {
        $application = EnrollmentApplication::with('gradeLevel')->find($applicationId);

        if (! $application) {
            return response()->json(['message' => 'Solicitud no encontrada.'], 404);
        }

        $requiredDocIds = DocumentType::query()
            ->where('is_required', true)
            ->where('is_active', true)
            ->where('level', $application->gradeLevel?->level)
            ->pluck('id');

        $deliveredRequiredCount = EnrollmentApplicationDocument::query()
            ->where('enrollment_application_id', $applicationId)
            ->where('delivered', true)
            ->whereIn('document_type_id', $requiredDocIds)
            ->count();

        return response()->json([
            'total_required' => $requiredDocIds->count(),
            'delivered_required' => $deliveredRequiredCount,
            'is_complete' => $deliveredRequiredCount >= $requiredDocIds->count(),
        ]);
    }
}
