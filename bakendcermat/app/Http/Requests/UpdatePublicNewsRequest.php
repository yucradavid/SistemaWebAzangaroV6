<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePublicNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $newsId = $this->route('public_news')?->id ?? $this->route('publicNews')?->id;

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('public_news', 'slug')->ignore($newsId)],
            'excerpt' => ['sometimes', 'string'],
            'content' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:1000'],
            'category' => ['sometimes', Rule::in(['institucional', 'academico', 'eventos', 'comunicados'])],
            'author' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['borrador', 'publicado', 'archivado'])],
            'is_featured' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
