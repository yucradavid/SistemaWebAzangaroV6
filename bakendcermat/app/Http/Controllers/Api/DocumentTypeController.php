<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DocumentTypeController extends Controller
{
    private const LEVELS = ['inicial', 'primaria', 'secundaria'];

    public function index(Request $request): JsonResponse
    {
        $query = DocumentType::query();

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->string('level')->lower()->value());
        }

        $rows = $query->orderBy('display_order')->orderBy('name')->get();

        return response()->json(['data' => $rows]);
    }

    // GET /api/public/document-types?level=inicial
    // Publico y de solo lectura: se usa desde el formulario de pre-matricula
    // ANTES de que exista una solicitud/cuenta. Siempre fuerza is_active=true
    // sin confiar en el query param del cliente. No confundir con el
    // checklist de "entregados" (enrollment_application_documents), que el
    // admin marca DESPUES al revisar la solicitud — este endpoint solo
    // sugiere que traer, no registra nada.
    public function publicIndex(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'level' => ['required', 'string', Rule::in(self::LEVELS)],
        ])->validate();

        $rows = DocumentType::query()
            ->where('is_active', true)
            ->where('level', $validated['level'])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'is_required', 'display_order']);

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
            'level' => ['required', 'string', Rule::in(self::LEVELS)],
        ])->validate();

        $row = DocumentType::create($validated);

        return response()->json([
            'message' => 'Tipo de documento creado correctamente.',
            'data' => $row,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = DocumentType::find($id);

        if (! $row) {
            return response()->json(['message' => 'Tipo de documento no encontrado.'], 404);
        }

        $validated = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'boolean',
            'display_order' => 'integer|min:0',
            'is_active' => 'boolean',
            'level' => ['sometimes', 'required', 'string', Rule::in(self::LEVELS)],
        ])->validate();

        $row->update($validated);

        return response()->json([
            'message' => 'Tipo de documento actualizado correctamente.',
            'data' => $row->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $row = DocumentType::find($id);

        if (! $row) {
            return response()->json(['message' => 'Tipo de documento no encontrado.'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Tipo de documento eliminado correctamente.']);
    }
}
