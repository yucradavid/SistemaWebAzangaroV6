<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicYearRequest;
use App\Http\Requests\UpdateAcademicYearRequest;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicYearController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AcademicYear::query()->withCount($this->countableRelations());

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);
        $query->orderByDesc('year');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        $year = DB::transaction(function () use ($request) {
            if ($request->boolean('is_active')) {
                AcademicYear::where('is_active', true)->update(['is_active' => false]);
            }

            return AcademicYear::create($request->validated());
        });

        return response()->json([
            'message' => 'Ano academico creado correctamente.',
            'data' => $year->loadCount($this->countableRelations()),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $year = AcademicYear::query()
            ->withCount($this->countableRelations())
            ->find($id);

        if (!$year) {
            return response()->json(['message' => 'Ano academico no encontrado.'], 404);
        }

        return response()->json(['data' => $year]);
    }

    public function update(UpdateAcademicYearRequest $request, $id): JsonResponse
    {
        $year = AcademicYear::find($id);

        if (!$year) {
            return response()->json(['message' => 'Ano academico no encontrado.'], 404);
        }

        DB::transaction(function () use ($request, $id, $year) {
            if ($request->boolean('is_active')) {
                AcademicYear::where('is_active', true)
                    ->where('id', '!=', $id)
                    ->update(['is_active' => false]);
            }

            $year->update($request->validated());
        });

        return response()->json([
            'message' => 'Ano academico actualizado correctamente.',
            'data' => $year->fresh()->loadCount($this->countableRelations()),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $year = AcademicYear::find($id);

        if (!$year) {
            return response()->json(['message' => 'Ano academico no encontrado.'], 404);
        }

        if ($year->is_active) {
            return response()->json([
                'message' => 'No se puede eliminar el ano academico activo.',
            ], 422);
        }

        $hasRelations = $year->periods()->exists()
            || $year->sections()->exists()
            || $year->periodHistories()->exists()
            || $year->studentDiscounts()->exists()
            || $year->financialPlans()->exists();

        if ($hasRelations) {
            return response()->json([
                'message' => 'No se puede eliminar el ano academico porque tiene registros relacionados.',
            ], 422);
        }

        $year->delete();

        return response()->json(['message' => 'Ano academico eliminado correctamente.']);
    }

    private function countableRelations(): array
    {
        return [
            'periods',
            'sections',
            'periodHistories',
            'studentDiscounts',
            'financialPlans',
        ];
    }
}
