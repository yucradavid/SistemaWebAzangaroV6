<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentFinalStatus;
use Illuminate\Http\Request;

class StudentFinalStatusController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentFinalStatus::query()
            ->with(['student', 'academicYear', 'gradeLevel', 'decider']);

        foreach (['student_id', 'academic_year_id', 'grade_level_id', 'final_status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('recovery_required')) {
            $query->where('recovery_required', $request->boolean('recovery_required'));
        }

        return response()->json(
            $query->orderByDesc('decided_at')->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function show(StudentFinalStatus $studentFinalStatus)
    {
        return $studentFinalStatus->load(['student', 'academicYear', 'gradeLevel', 'decider']);
    }
}
