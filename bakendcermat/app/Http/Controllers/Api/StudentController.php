<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['section.gradeLevel']);
        $perPage = (int) $request->integer('per_page', 20);
        $academicYearId = $request->input('academic_year_id');
        $onlyWithCharges = $request->boolean('only_with_charges');
        $includeVoided = $request->boolean('include_voided');

        $chargeScope = function ($chargeQuery) use ($academicYearId, $includeVoided) {
            if ($academicYearId) {
                $chargeQuery->where('academic_year_id', $academicYearId);
            }

            if (!$includeVoided && Schema::hasColumn('charges', 'voided_at')) {
                $chargeQuery->whereNull('voided_at');
            }
        };

        if ($onlyWithCharges) {
            $query->whereHas('charges', $chargeScope)
                ->withCount([
                    'charges as active_charges_count' => $chargeScope,
                ]);
        }

        if ($request->has('section_id'))
            $query->where('section_id', $request->section_id);
        if ($request->has('status'))
            $query->where('status', $request->status);
        if ($request->has('dni'))
            $query->where('dni', $request->dni);
        if ($request->has('student_code'))
            $query->where('student_code', $request->student_code);

        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('first_name', 'ilike', "%{$q}%")
                    ->orWhere('last_name', 'ilike', "%{$q}%")
                    ->orWhere('student_code', 'ilike', "%{$q}%")
                    ->orWhere('dni', 'ilike', "%{$q}%");
            });
        }

        return response()->json(
            $query
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->paginate($perPage)
        );
    }

    public function store(StoreStudentRequest $request)
    {
        $row = Student::create($request->validated());
        return response()->json(['message' => 'Estudiante creado', 'data' => $row], 201);
    }

    public function show($id)
    {
        $row = Student::find($id);
        if (!$row)
            return response()->json(['message' => 'Estudiante no encontrado'], 404);
        return response()->json($row);
    }

    public function update(UpdateStudentRequest $request, $id)
    {
        $row = Student::find($id);
        if (!$row)
            return response()->json(['message' => 'Estudiante no encontrado'], 404);

        $row->update($request->validated());
        return response()->json(['message' => 'Estudiante actualizado', 'data' => $row]);
    }

    public function destroy($id)
    {
        $row = Student::find($id);
        if (!$row)
            return response()->json(['message' => 'Estudiante no encontrado'], 404);

        $row->delete();
        return response()->json(['message' => 'Estudiante eliminado']);
    }
}
