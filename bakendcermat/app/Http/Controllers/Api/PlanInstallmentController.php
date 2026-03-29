<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlanInstallmentRequest;
use App\Http\Requests\UpdatePlanInstallmentRequest;
use App\Models\PlanInstallment;
use Illuminate\Http\Request;

class PlanInstallmentController extends Controller
{
    public function index(Request $request)
    {
        $q = PlanInstallment::with(['plan', 'plan.academicYear', 'plan.concept']);

        if ($request->filled('plan_id')) {
            $q->where('plan_id', $request->plan_id);
        }

        return $q->orderBy('plan_id')->orderBy('installment_number')->paginate(100);
    }

    public function store(StorePlanInstallmentRequest $request)
    {
        $data = $request->validated();

        $exists = PlanInstallment::where('plan_id', $data['plan_id'])
            ->where('installment_number', $data['installment_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe esa cuota para ese plan.'
            ], 422);
        }

        $data['created_at'] = now();

        $installment = PlanInstallment::create($data);

        return response()->json($installment->load(['plan', 'plan.academicYear', 'plan.concept']), 201);
    }

    public function show(PlanInstallment $planInstallment)
    {
        return $planInstallment->load(['plan', 'plan.academicYear', 'plan.concept']);
    }

    public function update(UpdatePlanInstallmentRequest $request, PlanInstallment $planInstallment)
    {
        $data = $request->validated();

        $number = $data['installment_number'] ?? $planInstallment->installment_number;

        $exists = PlanInstallment::where('plan_id', $planInstallment->plan_id)
            ->where('installment_number', $number)
            ->where('id', '!=', $planInstallment->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe otra cuota con ese número dentro del mismo plan.'
            ], 422);
        }

        $planInstallment->update($data);

        return $planInstallment->load(['plan', 'plan.academicYear', 'plan.concept']);
    }

    public function destroy(PlanInstallment $planInstallment)
    {
        $planInstallment->delete();
        return response()->noContent();
    }
}
