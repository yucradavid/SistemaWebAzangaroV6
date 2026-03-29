<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromotionRuleRequest;
use App\Http\Requests\UpdatePromotionRuleRequest;
use App\Models\PromotionRule;
use Illuminate\Http\Request;

class PromotionRuleController extends Controller
{
    public function index(Request $request)
    {
        $query = PromotionRule::query();

        foreach (['education_level', 'grade_number', 'promotion_mode', 'permanence_mode'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return response()->json(
            $query->orderBy('education_level')->orderBy('grade_number')->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function store(StorePromotionRuleRequest $request)
    {
        $row = PromotionRule::create($request->validated());

        return response()->json($row, 201);
    }

    public function show(PromotionRule $promotionRule)
    {
        return $promotionRule;
    }

    public function update(UpdatePromotionRuleRequest $request, PromotionRule $promotionRule)
    {
        $promotionRule->update($request->validated());

        return $promotionRule->fresh();
    }

    public function destroy(PromotionRule $promotionRule)
    {
        $promotionRule->delete();

        return response()->noContent();
    }
}
