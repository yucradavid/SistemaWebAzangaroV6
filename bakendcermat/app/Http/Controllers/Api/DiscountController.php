<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiscountRequest;
use App\Http\Requests\UpdateDiscountRequest;
use App\Models\Discount;
use Illuminate\Http\Request;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $q = Discount::with('concept');

        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }

        if ($request->filled('scope')) {
            $q->where('scope', $request->scope);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        return $q->orderBy('name')->paginate(50);
    }

    public function store(StoreDiscountRequest $request)
    {
        $data = $request->validated();
        $data['scope'] = $data['scope'] ?? 'todos';
        $data['is_active'] = $data['is_active'] ?? true;

        if (!in_array($data['scope'], ['especifico', 'concepto_especifico'], true)) {
            $data['specific_concept_id'] = null;
        }

        $discount = Discount::create($data);

        return response()->json($discount->load('concept'), 201);
    }

    public function show(Discount $discount)
    {
        return $discount->load('concept', 'studentDiscounts');
    }

    public function update(UpdateDiscountRequest $request, Discount $discount)
    {
        $data = $request->validated();
        $scope = $data['scope'] ?? $discount->scope;

        if (!in_array($scope, ['especifico', 'concepto_especifico'], true)) {
            $data['specific_concept_id'] = null;
        }

        $discount->update($data);

        return $discount->load('concept');
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();
        return response()->noContent();
    }
}
