<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewAssignmentSubmissionRequest;
use App\Http\Requests\StoreAssignmentSubmissionRequest;
use App\Http\Requests\UpdateAssignmentSubmissionRequest;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class AssignmentSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $q = AssignmentSubmission::with(['assignment', 'student', 'reviewer']);

        if ($request->filled('assignment_id')) {
            $q->where('assignment_id', $request->assignment_id);
        }

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }

        return $q->orderByDesc('submitted_at')->orderByDesc('created_at')->paginate(50);
    }

    public function store(StoreAssignmentSubmissionRequest $request)
    {
        $data = $request->validated();

        $exists = AssignmentSubmission::where('assignment_id', $data['assignment_id'])
            ->where('student_id', $data['student_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'El estudiante ya tiene una entrega registrada para esta tarea.'
            ], 422);
        }

        $data['status'] = $data['status'] ?? 'entregado';
        $data['submitted_at'] = now();

        $submission = AssignmentSubmission::create($data);

        return response()->json($submission->load(['assignment', 'student', 'reviewer']), 201);
    }

    public function show(AssignmentSubmission $assignmentSubmission)
    {
        return $assignmentSubmission->load(['assignment', 'student', 'reviewer']);
    }

    public function update(UpdateAssignmentSubmissionRequest $request, AssignmentSubmission $assignmentSubmission)
    {
        $assignmentSubmission->update($request->validated());

        return $assignmentSubmission->load(['assignment', 'student', 'reviewer']);
    }

    public function destroy(AssignmentSubmission $assignmentSubmission)
    {
        $assignmentSubmission->delete();
        return response()->noContent();
    }

    public function review(ReviewAssignmentSubmissionRequest $request, AssignmentSubmission $assignmentSubmission)
    {
        $assignmentSubmission->update([
            'score' => $request->validated()['score'] ?? null,
            'feedback' => $request->validated()['feedback'] ?? null,
            'status' => 'revisado',
            'reviewed_at' => now(),
            'reviewed_by' => optional($request->user())->id,
        ]);

        return $assignmentSubmission->load(['assignment', 'student', 'reviewer']);
    }
}
