<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BulkImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BulkImportController extends Controller
{
    private const TYPES = [
        'teachers',
        'guardians',
        'students',
        'student_guardians',
        'teacher_assignments',
    ];

    public function __construct(
        private readonly BulkImportService $bulkImportService
    ) {
    }

    public function preview(Request $request, string $type): JsonResponse
    {
        $this->validateRequest($request, $type);

        return response()->json(
            $this->bulkImportService->preview($type, $request->file('file'), $this->extractContext($request))
        );
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $this->validateRequest($request, $type);

        $result = $this->bulkImportService->import(
            $type,
            $request->file('file'),
            $this->extractContext($request),
            (string) ($request->user()?->id ?? '')
        );

        $status = ($result['summary']['error_rows'] ?? 0) > 0 ? 422 : 201;

        return response()->json($result, $status);
    }

    private function validateRequest(Request $request, string $type): void
    {
        validator(
            ['type' => $type] + $request->all(),
            [
                'type' => ['required', 'string', Rule::in(self::TYPES)],
                'file' => ['required', 'file', 'mimes:csv,txt'],
                'section_id' => ['nullable', 'uuid', 'exists:sections,id'],
                'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
                'default_password' => ['nullable', 'string', 'min:8'],
                'auto_enroll_by_section' => ['nullable', 'boolean'],
            ]
        )->validate();
    }

    private function extractContext(Request $request): array
    {
        return [
            'section_id' => $request->input('section_id'),
            'course_id' => $request->input('course_id'),
            'default_password' => $request->input('default_password'),
            'auto_enroll_by_section' => $request->has('auto_enroll_by_section')
                ? $request->boolean('auto_enroll_by_section')
                : null,
        ];
    }
}
