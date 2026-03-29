<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompetencyRequest;
use App\Http\Requests\UpdateCompetencyRequest;
use App\Models\Competency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CompetencyController extends Controller
{
    public function index(Request $request)
    {
        Log::info('CompetencyController@index request', [
            'course_id' => $request->course_id,
            'q' => $request->q,
            'user_id' => optional($request->user())->id,
        ]);

        $q = Competency::query();

        if ($request->filled('course_id')) $q->where('course_id', $request->course_id);
        if ($request->filled('q')) {
            $search = '%' . $request->q . '%';
            $q->where(function ($query) use ($search) {
                $query->where('description', 'ilike', $search)
                    ->orWhere('code', 'ilike', $search);
            });
        }

        $result = $q->orderBy('order_index')->orderBy('description')->paginate(30);

        Log::info('CompetencyController@index response', [
            'count' => count($result->items()),
            'total' => $result->total(),
        ]);

        return $result;
    }

    public function store(StoreCompetencyRequest $request)
    {
        $payload = $this->normalizePayload($request->validated(), true);

        Log::info('CompetencyController@store payload', $payload);

        $competency = Competency::create($payload);

        return response()->json($competency->load('course'), 201);
    }

    public function show(Competency $competency)
    {
        return $competency->load('course');
    }

    public function update(UpdateCompetencyRequest $request, Competency $competency)
    {
        $payload = $this->normalizePayload($request->validated(), false, $competency);

        Log::info('CompetencyController@update payload', [
            'id' => $competency->id,
            'payload' => $payload,
        ]);

        $competency->update($payload);

        return $competency->fresh()->load('course');
    }

    public function destroy(Competency $competency)
    {
        $competency->delete();
        return response()->noContent();
    }

    private function normalizePayload(array $payload, bool $isCreate = false, ?Competency $competency = null): array
    {
        $payload['description'] = trim((string) ($payload['description'] ?? ''));

        if (array_key_exists('order', $payload) && !array_key_exists('order_index', $payload)) {
            $payload['order_index'] = $payload['order'];
        }

        unset($payload['order'], $payload['name']);

        if (empty($payload['order_index'])) {
            $payload['order_index'] = $isCreate
                ? $this->nextOrderIndex((string) $payload['course_id'])
                : ($competency?->order_index ?? 1);
        }

        if (empty($payload['code'])) {
            $payload['code'] = $this->generateCode($payload['description'], (int) $payload['order_index']);
        }

        return $payload;
    }

    private function nextOrderIndex(string $courseId): int
    {
        return (int) Competency::query()
            ->where('course_id', $courseId)
            ->max('order_index') + 1;
    }

    private function generateCode(string $description, int $orderIndex): string
    {
        $tokens = preg_split('/\s+/', trim($description)) ?: [];
        $acronym = collect($tokens)
            ->filter(fn ($token) => $token !== '')
            ->take(3)
            ->map(fn ($token) => Str::upper(Str::substr($token, 0, 1)))
            ->implode('');

        if ($acronym === '') {
            $acronym = 'COMP';
        }

        return Str::limit($acronym . $orderIndex, 50, '');
    }
}
