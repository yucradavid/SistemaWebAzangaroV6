<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentGuardian;
use App\Http\Requests\StoreStudentGuardianRequest;
use App\Http\Requests\UpdateStudentGuardianRequest;
use Illuminate\Http\Request;

class StudentGuardianController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentGuardian::query();

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('guardian_id')) {
            $query->where('guardian_id', $request->guardian_id);
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate(20)
        );
    }

    public function store(StoreStudentGuardianRequest $request)
    {
        $row = StudentGuardian::create($request->validated());

        return response()->json([
            'message' => 'Vínculo estudiante-apoderado creado',
            'data' => $row
        ], 201);
    }

    public function show($id)
    {
        $row = StudentGuardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Vínculo no encontrado'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdateStudentGuardianRequest $request, $id)
    {
        $row = StudentGuardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Vínculo no encontrado'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Vínculo actualizado',
            'data' => $row
        ]);
    }

    public function destroy($id)
    {
        $row = StudentGuardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Vínculo no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Vínculo eliminado']);
    }
}
