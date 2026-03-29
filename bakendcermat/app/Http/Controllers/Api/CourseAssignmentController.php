<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseAssignmentRequest;
use App\Http\Requests\UpdateCourseAssignmentRequest;
use App\Models\CourseAssignment;
use Illuminate\Http\Request;

class CourseAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = CourseAssignment::query()
            ->with(['teacher', 'course', 'section', 'academicYear']);

        foreach (['teacher_id','course_id','section_id','academic_year_id'] as $f) {
            if ($request->filled($f)) {
                $query->where($f, $request->input($f));
            }
        }

        // filtro tutor
        if ($request->filled('is_tutor')) {
            $query->where('is_tutor', filter_var($request->input('is_tutor'), FILTER_VALIDATE_BOOLEAN));
        }

        $sort = $request->input('sort', 'created_at');
        $dir  = strtolower($request->input('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['created_at'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        $query->orderBy($sort, $dir);

        return response()->json($query->paginate(20));
    }

    public function store(StoreCourseAssignmentRequest $request)
    {
        $data = $request->validated();

        // ✅ Validar UNIQUE real de la BD: (course_id, section_id, academic_year_id)
        $exists = CourseAssignment::where('course_id', $data['course_id'])
            ->where('section_id', $data['section_id'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe una asignación para este curso en esta sección y año académico.'
            ], 422);
        }

        // ✅ Regla tutor: solo 1 tutor por sección + año
        $isTutor = (bool)($data['is_tutor'] ?? false);
        if ($isTutor) {
            $tutorExists = CourseAssignment::where('section_id', $data['section_id'])
                ->where('academic_year_id', $data['academic_year_id'])
                ->where('is_tutor', true)
                ->exists();

            if ($tutorExists) {
                return response()->json([
                    'message' => 'Ya existe un tutor asignado para esta sección en este año académico.'
                ], 422);
            }
        }

        $row = CourseAssignment::create($data);

        return response()->json([
            'message' => 'Asignación creada correctamente',
            'data' => $row->load(['teacher','course','section','academicYear'])
        ], 201);
    }

    public function show($id)
    {
        $row = CourseAssignment::with(['teacher','course','section','academicYear'])->find($id);

        if (!$row) {
            return response()->json(['message' => 'Asignación no encontrada'], 404);
        }

        return response()->json($row);
    }

    public function update(UpdateCourseAssignmentRequest $request, $id)
    {
        $row = CourseAssignment::find($id);

        if (!$row) {
            return response()->json(['message' => 'Asignación no encontrada'], 404);
        }

        $data = $request->validated();

        $finalCourse  = $data['course_id'] ?? $row->course_id;
        $finalSection = $data['section_id'] ?? $row->section_id;
        $finalYear    = $data['academic_year_id'] ?? $row->academic_year_id;

        // ✅ UNIQUE real
        $exists = CourseAssignment::where('course_id', $finalCourse)
            ->where('section_id', $finalSection)
            ->where('academic_year_id', $finalYear)
            ->where('id', '!=', $row->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe una asignación para este curso en esta sección y año académico.'
            ], 422);
        }

        // ✅ Regla tutor único
        $finalIsTutor = array_key_exists('is_tutor', $data) ? (bool)$data['is_tutor'] : (bool)$row->is_tutor;

        if ($finalIsTutor) {
            $tutorExists = CourseAssignment::where('section_id', $finalSection)
                ->where('academic_year_id', $finalYear)
                ->where('is_tutor', true)
                ->where('id', '!=', $row->id)
                ->exists();

            if ($tutorExists) {
                return response()->json([
                    'message' => 'Ya existe un tutor asignado para esta sección en este año académico.'
                ], 422);
            }
        }

        $row->update($data);

        return response()->json([
            'message' => 'Asignación actualizada',
            'data' => $row->load(['teacher','course','section','academicYear'])
        ]);
    }

    public function destroy($id)
    {
        $row = CourseAssignment::find($id);

        if (!$row) {
            return response()->json(['message' => 'Asignación no encontrada'], 404);
        }

        $row->delete();

        return response()->json(['message' => 'Asignación eliminada']);
    }
}
