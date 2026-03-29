<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecoveryProcessRequest;
use App\Http\Requests\UpdateRecoveryProcessRequest;
use App\Models\RecoveryProcess;
use Illuminate\Http\Request;

class RecoveryProcessController extends Controller
{
    public function index(Request $request)
    {
        $query = RecoveryProcess::query()
            ->with(['student', 'academicYear', 'gradeLevel', 'results.competency', 'results.course']);

        foreach (['student_id', 'academic_year_id', 'grade_level_id', 'status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        return response()->json(
            $query->orderByDesc('updated_at')->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function store(StoreRecoveryProcessRequest $request)
    {
        $row = RecoveryProcess::create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json($row->load(['student', 'academicYear', 'gradeLevel', 'results']), 201);
    }

    public function show(RecoveryProcess $recoveryProcess)
    {
        return $recoveryProcess->load(['student', 'academicYear', 'gradeLevel', 'results.competency', 'results.course']);
    }

    public function update(UpdateRecoveryProcessRequest $request, RecoveryProcess $recoveryProcess)
    {
        $recoveryProcess->update([
            ...$request->validated(),
            'updated_by' => $request->user()?->id,
        ]);

        return $recoveryProcess->fresh()->load(['student', 'academicYear', 'gradeLevel', 'results.competency', 'results.course']);
    }

    public function destroy(RecoveryProcess $recoveryProcess)
    {
        $recoveryProcess->delete();

        return response()->noContent();
    }
}
