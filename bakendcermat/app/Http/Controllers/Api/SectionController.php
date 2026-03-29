<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSectionRequest;
use App\Http\Requests\UpdateSectionRequest;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Section::query()
            ->with(['gradeLevel', 'academicYear'])
            ->withCount($this->countableRelations());

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('grade_level_id')) {
            $query->where('grade_level_id', $request->grade_level_id);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($nested) use ($search) {
                $nested->where('section_letter', 'like', "%{$search}%")
                    ->orWhereHas('gradeLevel', function ($gradeQuery) use ($search) {
                        $gradeQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->integer('per_page', 20);
        $useSimple = $request->boolean('simple', false);

        $query->orderBy('academic_year_id')
            ->orderBy('grade_level_id')
            ->orderBy('section_letter');

        return response()->json(
            $useSimple ? $query->simplePaginate($perPage) : $query->paginate($perPage)
        );
    }

    public function store(StoreSectionRequest $request): JsonResponse
    {
        $row = Section::create($request->validated());

        return response()->json([
            'message' => 'Seccion creada correctamente.',
            'data' => $row->load(['gradeLevel', 'academicYear'])->loadCount($this->countableRelations()),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $row = Section::query()
            ->with(['gradeLevel', 'academicYear'])
            ->withCount($this->countableRelations())
            ->find($id);

        if (!$row) {
            return response()->json(['message' => 'Seccion no encontrada.'], 404);
        }

        return response()->json(['data' => $row]);
    }

    public function update(UpdateSectionRequest $request, $id): JsonResponse
    {
        $row = Section::find($id);

        if (!$row) {
            return response()->json(['message' => 'Seccion no encontrada.'], 404);
        }

        $row->update($request->validated());

        return response()->json([
            'message' => 'Seccion actualizada correctamente.',
            'data' => $row->fresh()->load(['gradeLevel', 'academicYear'])->loadCount($this->countableRelations()),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $row = Section::query()
            ->withCount($this->countableRelations())
            ->find($id);

        if (!$row) {
            return response()->json(['message' => 'Seccion no encontrada.'], 404);
        }

        $hasRelations = collect($this->countableRelations())
            ->sum(fn ($relation) => (int) ($row->{$relation . '_count'} ?? 0)) > 0;

        if ($hasRelations) {
            return response()->json([
                'message' => 'No se puede eliminar la seccion porque tiene registros vinculados.',
            ], 422);
        }

        $row->delete();

        return response()->json(['message' => 'Seccion eliminada correctamente.']);
    }

    private function countableRelations(): array
    {
        return [
            'students',
            'studentCourseEnrollments',
            'teacherCourseAssignments',
            'courseSchedules',
            'assignments',
            'announcements',
            'attendances',
        ];
    }
}
