<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeConceptRequest;
use App\Http\Requests\UpdateFeeConceptRequest;
use App\Models\FeeConcept;
use Illuminate\Http\Request;

class FeeConceptController extends Controller
{
    public function index(Request $request)
    {
        $q = FeeConcept::query();

        if ($request->filled('type')) $q->where('type', $request->type);
        if ($request->filled('periodicity')) $q->where('periodicity', $request->periodicity);
        if ($request->filled('is_active')) $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        if ($request->filled('q')) $q->where('name', 'ilike', '%'.$request->q.'%');

        return $q->orderBy('name')->paginate(30);
    }

    public function store(StoreFeeConceptRequest $request)
    {
        $concept = FeeConcept::create($request->validated());
        return response()->json($concept, 201);
    }

    public function show(FeeConcept $feeConcept)
    {
        return $feeConcept;
    }

    public function update(UpdateFeeConceptRequest $request, FeeConcept $feeConcept)
    {
        $feeConcept->update($request->validated());
        return $feeConcept;
    }

    public function destroy(FeeConcept $feeConcept)
    {
        $feeConcept->delete();
        return response()->noContent();
    }
}
