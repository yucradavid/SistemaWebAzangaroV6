<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Period;
use App\Http\Requests\StorePeriodRequest;
use App\Http\Requests\UpdatePeriodRequest;
use App\Services\AcademicPeriodHistoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PeriodController extends Controller
{
    public function __construct(
        private readonly AcademicPeriodHistoryService $academicPeriodHistoryService
    ) {
    }

    public function index(Request $request)
    {
        Log::info('PeriodController@index request', [
            'academic_year_id' => $request->academic_year_id,
            'is_closed' => $request->is_closed,
            'user_id' => optional($request->user())->id,
        ]);

        $query = Period::query()->with('academicYear');

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('is_closed')) {
            $query->where('is_closed', filter_var($request->is_closed, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $result = $query->orderBy('academic_year_id')
            ->orderBy('period_number');

        $result = $useSimple
            ? $result->simplePaginate($perPage)
            : $result->paginate($perPage);

        Log::info('PeriodController@index response', [
            'count' => count($result->items()),
            'total' => method_exists($result, 'total') ? $result->total() : null,
            'simple' => $useSimple,
        ]);

        return response()->json($result);
    }

    public function store(StorePeriodRequest $request)
    {
        $row = Period::create($request->validated());

        return response()->json([
            'message' => 'Periodo creado correctamente',
            'data' => $row
        ], 201);
    }

    public function show($id)
    {
        $row = Period::query()->with('academicYear')->find($id);

        if (!$row) {
            return response()->json(['message' => 'Periodo no encontrado'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdatePeriodRequest $request, $id)
    {
        $row = Period::find($id);

        if (!$row) {
            return response()->json(['message' => 'Periodo no encontrado'], 404);
        }

        $validated = $request->validated();
        $history = null;
        $wasClosed = (bool) $row->is_closed;
        $willBeClosed = array_key_exists('is_closed', $validated)
            ? (bool) $validated['is_closed']
            : $wasClosed;

        DB::transaction(function () use ($row, $validated, $request, $wasClosed, $willBeClosed, &$history) {
            $row->update($validated);

            if (!$wasClosed && $willBeClosed) {
                $history = $this->academicPeriodHistoryService->generateForPeriod(
                    $row->fresh(),
                    $request->user()?->id
                );
            }
        });

        return response()->json([
            'message' => 'Periodo actualizado',
            'data' => $row->fresh(),
            'history' => $history,
        ]);
    }

    public function destroy($id)
    {
        $row = Period::find($id);

        if (!$row) {
            return response()->json(['message' => 'Periodo no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Periodo eliminado']);
    }
}
