<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinalCompetencyResult;
use Illuminate\Http\Request;

class FinalCompetencyResultController extends Controller
{
    public function index(Request $request)
    {
        $query = FinalCompetencyResult::query()
            ->with(['student', 'course', 'competency', 'academicYear', 'sourcePeriod']);

        foreach (['student_id', 'course_id', 'competency_id', 'academic_year_id', 'final_level'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('requires_support')) {
            $query->where('requires_support', $request->boolean('requires_support'));
        }

        return response()->json(
            $query->orderBy('course_id')->orderBy('competency_id')->paginate((int) $request->integer('per_page', 50))
        );
    }

    public function show(FinalCompetencyResult $finalCompetencyResult)
    {
        return $finalCompetencyResult->load(['student', 'course', 'competency', 'academicYear', 'sourcePeriod']);
    }
}
