<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentDiscountRequest;
use App\Http\Requests\UpdateStudentDiscountRequest;
use App\Models\StudentDiscount;
use Illuminate\Http\Request;

class StudentDiscountController extends Controller
{
    public function index(Request $request)
    {
        $q = StudentDiscount::with(['student', 'discount', 'academicYear', 'assignedBy']);

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('discount_id')) {
            $q->where('discount_id', $request->discount_id);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        return $q->orderByDesc('created_at')->paginate(50);
    }

    public function store(StoreStudentDiscountRequest $request)
    {
        $data = $request->validated();

        $exists = StudentDiscount::where('student_id', $data['student_id'])
            ->where('discount_id', $data['discount_id'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ese descuento ya fue asignado al estudiante en ese año académico.'
            ], 422);
        }

        $data['assigned_by'] = optional($request->user())->id;
        $data['created_at'] = now();

        $studentDiscount = StudentDiscount::create($data);

        return response()->json(
            $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']),
            201
        );
    }

    public function show(StudentDiscount $studentDiscount)
    {
        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function update(UpdateStudentDiscountRequest $request, StudentDiscount $studentDiscount)
    {
        $studentDiscount->update($request->validated());

        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function destroy(StudentDiscount $studentDiscount)
    {
        $studentDiscount->delete();
        return response()->noContent();
    }
}
