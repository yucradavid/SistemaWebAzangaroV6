<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::query();
        $role = $request->user()?->profile?->role;

        if ($role === 'teacher') {
            $query->where('user_id', (string) $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('dni')) {
            $query->where('dni', $request->dni);
        }

        if ($request->has('teacher_code')) {
            $query->where('teacher_code', $request->teacher_code);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('first_name', 'ilike', "%{$q}%")
                    ->orWhere('last_name', 'ilike', "%{$q}%")
                    ->orWhere('teacher_code', 'ilike', "%{$q}%")
                    ->orWhere('specialization', 'ilike', "%{$q}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $query = $query->orderBy('last_name')
            ->orderBy('first_name');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreTeacherRequest $request)
    {
        $row = Teacher::create($request->validated());

        return response()->json([
            'message' => 'Docente creado',
            'data' => $row
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        if ($request->user()?->profile?->role === 'teacher' && (string) $row->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($row);
    }

    public function update(UpdateTeacherRequest $request, $id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Docente actualizado',
            'data' => $row
        ]);
    }

    public function destroy($id)
    {
        $row = Teacher::find($id);

        if (!$row) {
            return response()->json(['message' => 'Docente no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Docente eliminado']);
    }
}
