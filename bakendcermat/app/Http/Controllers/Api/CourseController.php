<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Section;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

            $academicYearId = $request->filled('academic_year_id')
                ? (string) $request->input('academic_year_id')
                : (string) $section->academic_year_id;

            $query->where('grade_level_id', $section->grade_level_id);
            $query->where(function ($subQuery) use ($section, $academicYearId) {
                $subQuery
                    ->whereExists(function ($existsQuery) use ($section, $academicYearId) {
                        $existsQuery->select(DB::raw(1))
                            ->from('course_assignments as ca')
                            ->whereColumn('ca.course_id', 'courses.id')
                            ->where('ca.section_id', $section->id)
                            ->where('ca.academic_year_id', $academicYearId);
                    })
                    ->orWhereExists(function ($existsQuery) use ($section, $academicYearId) {
                        $existsQuery->select(DB::raw(1))
                            ->from('teacher_course_assignments as tca')
                            ->whereColumn('tca.course_id', 'courses.id')
                            ->where('tca.section_id', $section->id)
                            ->where('tca.academic_year_id', $academicYearId)
                            ->where('tca.is_active', true);
                    })
                    ->orWhereExists(function ($existsQuery) use ($section, $academicYearId) {
                        $existsQuery->select(DB::raw(1))
                            ->from('student_course_enrollments as sce')
                            ->whereColumn('sce.course_id', 'courses.id')
                            ->where('sce.section_id', $section->id)
                            ->where('sce.academic_year_id', $academicYearId)
                            ->where('sce.status', 'active');
                    });
            });
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
