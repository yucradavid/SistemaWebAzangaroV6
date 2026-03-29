<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePublicNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:public_news,slug'],
            'excerpt' => ['required', 'string'],
            'content' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:1000'],
            'category' => ['nullable', Rule::in(['institucional', 'academico', 'eventos', 'comunicados'])],
            'author' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['borrador', 'publicado', 'archivado'])],
            'is_featured' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
