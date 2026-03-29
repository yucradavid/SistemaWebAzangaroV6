<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Http\Requests\StoreGuardianRequest;
use App\Http\Requests\UpdateGuardianRequest;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function index(Request $request)
    {
        $query = Guardian::query();

        if ($request->has('dni')) {
            $query->where('dni', $request->dni);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('is_primary')) {
            $query->where('is_primary', filter_var($request->is_primary, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('first_name', 'ilike', "%{$q}%")
                    ->orWhere('last_name', 'ilike', "%{$q}%")
                    ->orWhere('phone', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%");
            });
        }

        return response()->json(
            $query->orderBy('last_name')
                ->orderBy('first_name')
                ->paginate(20)
        );
    }

    public function store(StoreGuardianRequest $request)
    {
        $row = Guardian::create($request->validated());

        return response()->json([
            'message' => 'Apoderado creado',
            'data' => $row
        ], 201);
    }

    public function show($id)
    {
        $row = Guardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Apoderado no encontrado'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdateGuardianRequest $request, $id)
    {
        $row = Guardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Apoderado no encontrado'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Apoderado actualizado',
            'data' => $row
        ]);
    }

    public function destroy($id)
    {
        $row = Guardian::find($id);

        if (!$row) {
            return response()->json(['message' => 'Apoderado no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Apoderado eliminado']);
    }
}
