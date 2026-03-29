<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDescriptiveConclusionRequest;
use App\Http\Requests\UpdateDescriptiveConclusionRequest;
use App\Models\DescriptiveConclusion;
use Illuminate\Http\Request;

class DescriptiveConclusionController extends Controller
{
    public function index(Request $request)
    {
        $query = DescriptiveConclusion::query()
            ->with(['student', 'competency', 'period', 'academicYear']);

        foreach (['student_id', 'competency_id', 'period_id', 'academic_year_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('needs_support')) {
            $query->where('needs_support', $request->boolean('needs_support'));
        }

        return response()->json(
            $query->orderByDesc('updated_at')->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function store(StoreDescriptiveConclusionRequest $request)
    {
        $row = DescriptiveConclusion::create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
        ]);

        return response()->json($row->load(['student', 'competency', 'period', 'academicYear']), 201);
    }

    public function show(DescriptiveConclusion $descriptiveConclusion)
    {
        return $descriptiveConclusion->load(['student', 'competency', 'period', 'academicYear']);
    }

    public function update(UpdateDescriptiveConclusionRequest $request, DescriptiveConclusion $descriptiveConclusion)
    {
        $descriptiveConclusion->update($request->validated());

        return $descriptiveConclusion->fresh()->load(['student', 'competency', 'period', 'academicYear']);
    }

    public function destroy(DescriptiveConclusion $descriptiveConclusion)
    {
        $descriptiveConclusion->delete();

        return response()->noContent();
    }
}
