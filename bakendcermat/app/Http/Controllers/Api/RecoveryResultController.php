<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecoveryResultRequest;
use App\Http\Requests\UpdateRecoveryResultRequest;
use App\Models\RecoveryResult;
use Illuminate\Http\Request;

class RecoveryResultController extends Controller
{
    public function index(Request $request)
    {
        $query = RecoveryResult::query()
            ->with(['recoveryProcess.student', 'competency', 'course']);

        foreach (['recovery_process_id', 'competency_id', 'course_id', 'final_level'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        if ($request->filled('is_resolved')) {
            $query->where('is_resolved', $request->boolean('is_resolved'));
        }

        return response()->json(
            $query->orderByDesc('updated_at')->paginate((int) $request->integer('per_page', 30))
        );
    }

    public function store(StoreRecoveryResultRequest $request)
    {
        $row = RecoveryResult::create($request->validated());

        return response()->json($row->load(['recoveryProcess.student', 'competency', 'course']), 201);
    }

    public function show(RecoveryResult $recoveryResult)
    {
        return $recoveryResult->load(['recoveryProcess.student', 'competency', 'course']);
    }

    public function update(UpdateRecoveryResultRequest $request, RecoveryResult $recoveryResult)
    {
        $recoveryResult->update($request->validated());

        return $recoveryResult->fresh()->load(['recoveryProcess.student', 'competency', 'course']);
    }

    public function destroy(RecoveryResult $recoveryResult)
    {
        $recoveryResult->delete();

        return response()->noContent();
    }
}
