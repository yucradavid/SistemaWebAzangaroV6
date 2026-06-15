<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Section;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query();

        $section = null;
        if ($request->filled('section_id')) {
            $section = Section::query()->find($request->input('section_id'));

            if (!$section) {
                return response()->json([
                    'message' => 'Seccion no encontrada',
                ], 404);
            }

            // Todos los cursos del grado de la seccion, sin importar si ya tienen
            // horario/asignacion previa (de lo contrario un curso nuevo no podria
            // programarse por primera vez).
            $query->where('grade_level_id', $section->grade_level_id);
        }

        if ($request->has('grade_level_id')) {
            $query->where('grade_level_id', $request->grade_level_id);
        }

        if ($request->has('code')) {
            $query->where('code', $request->code);
        }

        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function($sub) use ($q) {
                $sub->where('name', 'ilike', "%{$q}%")
                    ->orWhere('code', 'ilike', "%{$q}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $query = $query->orderBy('grade_level_id')
            ->orderBy('name');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreCourseRequest $request)
    {
        $row = Course::create($request->validated());

        return response()->json([
            'message' => 'Curso creado correctamente',
            'data' => $row
        ], 201);
    }

    public function show($id)
    {
        $row = Course::find($id);

        if (!$row) {
            return response()->json(['message' => 'Curso no encontrado'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdateCourseRequest $request, $id)
    {
        $row = Course::find($id);

        if (!$row) {
            return response()->json(['message' => 'Curso no encontrado'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Curso actualizado',
            'data' => $row
        ]);
    }

    public function destroy($id)
    {
        $row = Course::find($id);

        if (!$row) {
            return response()->json(['message' => 'Curso no encontrado'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Curso eliminado']);
    }
}
