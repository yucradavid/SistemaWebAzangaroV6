<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicNewsRequest;
use App\Http\Requests\UpdatePublicNewsRequest;
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

        return $q->orderByDesc('published_at')->orderByDesc('created_at')->paginate(20);
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

        return response()->json($news->load(['creator', 'updater']), 201);
    }

    public function show(PublicNews $publicNews)
    {
        return $publicNews->load(['creator', 'updater']);
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

        return $publicNews->load(['creator', 'updater']);
    }

    public function destroy(PublicNews $publicNews)
    {
        $publicNews->delete();
        return response()->noContent();
    }
}
