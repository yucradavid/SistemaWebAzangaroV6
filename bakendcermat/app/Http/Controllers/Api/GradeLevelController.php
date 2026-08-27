<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGradeLevelRequest;
use App\Http\Requests\UpdateGradeLevelRequest;
use App\Models\GradeLevel;
use App\Support\StandardGradeCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeLevelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = GradeLevel::query()->withCount(['sections', 'courses']);

        if ($request->filled('level')) {
            $query->where('level', $request->string('level')->lower()->value());
        }

        if ($request->filled('grade')) {
            $query->where('grade', (int) $request->grade);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($nested) use ($search) {
                $nested->where('name', 'like', "%{$search}%")
                    ->orWhere('grade', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $query->orderByRaw("
            case level
                when 'inicial' then 1
                when 'primaria' then 2
                when 'secundaria' then 3
                else 99
            end
        ")->orderBy('grade');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreGradeLevelRequest $request): JsonResponse
    {
        $row = GradeLevel::create($request->validated());

        return response()->json([
            'message' => 'Nivel/grado creado correctamente.',
            'data' => $row->loadCount(['sections', 'courses']),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $row = GradeLevel::query()
            ->withCount(['sections', 'courses'])
            ->find($id);

        if (!$row) {
            return response()->json(['message' => 'Nivel/grado no encontrado.'], 404);
        }

        return response()->json(['data' => $row]);
    }

    public function update(UpdateGradeLevelRequest $request, $id): JsonResponse
    {
        $row = GradeLevel::find($id);

        if (!$row) {
            return response()->json(['message' => 'Nivel/grado no encontrado.'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Nivel/grado actualizado correctamente.',
            'data' => $row->fresh()->loadCount(['sections', 'courses']),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $row = GradeLevel::query()
            ->withCount(['sections', 'courses'])
            ->find($id);

        if (!$row) {
            return response()->json(['message' => 'Nivel/grado no encontrado.'], 404);
        }

        if (($row->sections_count ?? 0) > 0 || ($row->courses_count ?? 0) > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el grado porque tiene secciones o cursos vinculados.',
            ], 422);
        }

        $row->delete();

        return response()->json(['message' => 'Nivel/grado eliminado correctamente.']);
    }

    /**
     * GET /api/grade-levels/standard/{level}/missing
     * Compara los ordenes numericos existentes de un nivel contra el rango
     * estandar completo y devuelve cuales grados faltan.
     */
    public function missingStandardGrades(string $level): JsonResponse
    {
        $level = strtolower(trim($level));

        if (!in_array($level, StandardGradeCatalog::levels(), true)) {
            return response()->json(['message' => 'Nivel educativo invalido.'], 422);
        }

        $standard = StandardGradeCatalog::forLevel($level);
        $existingGrades = GradeLevel::query()->where('level', $level)->pluck('grade')->all();

        $missing = collect($standard)
            ->reject(fn ($name, $grade) => in_array($grade, $existingGrades, true))
            ->map(fn ($name, $grade) => ['grade' => $grade, 'name' => $name])
            ->values();

        return response()->json([
            'level' => $level,
            'standard_total' => count($standard),
            'existing_count' => count($existingGrades),
            'missing' => $missing,
        ]);
    }

    /**
     * POST /api/grade-levels/standard/{level}/generate
     * Crea todos los grados del rango estandar de un nivel que aun no
     * existan. Idempotente: si ya estan todos, no crea ni duplica nada.
     */
    public function generateStandardGrades(string $level): JsonResponse
    {
        $level = strtolower(trim($level));

        if (!in_array($level, StandardGradeCatalog::levels(), true)) {
            return response()->json(['message' => 'Nivel educativo invalido.'], 422);
        }

        $standard = StandardGradeCatalog::forLevel($level);
        $existingGrades = GradeLevel::query()->where('level', $level)->pluck('grade')->all();

        $created = [];

        DB::transaction(function () use ($standard, $existingGrades, $level, &$created) {
            foreach ($standard as $grade => $name) {
                if (in_array($grade, $existingGrades, true)) {
                    continue;
                }

                $created[] = GradeLevel::create([
                    'level' => $level,
                    'grade' => $grade,
                    'name' => $name,
                ]);
            }
        });

        return response()->json([
            'message' => count($created) > 0
                ? sprintf('Se crearon %d grado(s) estandar para el nivel %s.', count($created), $level)
                : 'No habia grados estandar faltantes para este nivel.',
            'created' => $created,
        ], count($created) > 0 ? 201 : 200);
    }
}
