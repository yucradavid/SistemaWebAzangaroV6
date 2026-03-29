<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinancialPlanRequest;
use App\Http\Requests\UpdateFinancialPlanRequest;
use App\Models\FinancialPlan;
use Illuminate\Http\Request;

class FinancialPlanController extends Controller
{
    public function index(Request $request)
    {
        $q = FinancialPlan::with(['academicYear', 'concept', 'installments']);

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('concept_id')) {
            $q->where('concept_id', $request->concept_id);
        }

        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return $q->orderBy('name')->paginate(50);
    }

    public function store(StoreFinancialPlanRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $plan = FinancialPlan::create($data);

        return response()->json($plan->load(['academicYear', 'concept', 'installments']), 201);
    }

    public function show(FinancialPlan $financialPlan)
    {
        return $financialPlan->load(['academicYear', 'concept', 'installments']);
    }

    public function update(UpdateFinancialPlanRequest $request, FinancialPlan $financialPlan)
    {
        $financialPlan->update($request->validated());

        return $financialPlan->load(['academicYear', 'concept', 'installments']);
    }

    public function destroy(FinancialPlan $financialPlan)
    {
        $financialPlan->installments()->delete();
        $financialPlan->delete();
        return response()->noContent();
    }
}
