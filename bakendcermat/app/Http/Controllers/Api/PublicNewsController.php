<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicNewsRequest;
use App\Http\Requests\UpdatePublicNewsRequest;
use App\Http\Resources\PublicNewsResource;
use App\Models\PublicNews;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicNewsController extends Controller
{
    public function index(Request $request)
    {
        $q = PublicNews::with(['creator', 'updater']);

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $q->where('category', $request->category);
        }

        if ($request->filled('is_featured')) {
            $q->where('is_featured', filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('q')) {
            $q->where(function ($query) use ($request) {
                $query->where('title', 'ilike', "%{$request->q}%")
                    ->orWhere('excerpt', 'ilike', "%{$request->q}%")
                    ->orWhere('content', 'ilike', "%{$request->q}%");
            });
        }

        $perPage = $request->integer('per_page', 20);
        $paginated = $q->orderByDesc('published_at')->orderByDesc('created_at')->paginate($perPage);

        return PublicNewsResource::collection($paginated);
    }

    /**
     * Endpoint público: solo noticias publicadas
     */
    public function published(Request $request)
    {
        $q = PublicNews::where('status', 'publicado')
            ->where(function ($query) {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            });

        if ($request->filled('category')) {
            $q->where('category', $request->category);
        }

        if ($request->filled('featured')) {
            $q->where('is_featured', filter_var($request->featured, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('q')) {
            $q->where(function ($query) use ($request) {
                $query->where('title', 'ilike', "%{$request->q}%")
                    ->orWhere('excerpt', 'ilike', "%{$request->q}%");
            });
        }

        $perPage = $request->integer('per_page', 12);
        $paginated = $q->orderByDesc('published_at')->orderByDesc('created_at')->paginate($perPage);

        return PublicNewsResource::collection($paginated);
    }

    public function store(StorePublicNewsRequest $request)
    {
        $data = $request->validated();

        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
        $data['category'] = $data['category'] ?? 'institucional';
        $data['author'] = $data['author'] ?? 'Dirección General';
        $data['status'] = $data['status'] ?? 'borrador';
        $data['is_featured'] = $data['is_featured'] ?? false;
        $data['created_by'] = optional($request->user())->id;
        $data['updated_by'] = optional($request->user())->id;

        if (($data['status'] ?? 'borrador') === 'publicado' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $news = PublicNews::create($data);

        return new PublicNewsResource($news->load(['creator', 'updater']));
    }

    public function show(PublicNews $publicNews)
    {
        return new PublicNewsResource($publicNews->load(['creator', 'updater']));
    }

    public function update(UpdatePublicNewsRequest $request, PublicNews $publicNews)
    {
        $data = $request->validated();

        if (!isset($data['slug']) && isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        if (($data['status'] ?? $publicNews->status) === 'publicado' && empty($publicNews->published_at) && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $data['updated_by'] = optional($request->user())->id;

        $publicNews->update($data);

        return new PublicNewsResource($publicNews->load(['creator', 'updater']));
    }

    public function destroy(PublicNews $publicNews)
    {
        $publicNews->delete();
        return response()->noContent();
    }
}
