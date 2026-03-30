<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicNewsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'imageUrl' => $this->image_url,
            'category' => $this->category,
            'author' => $this->author,
            'status' => $this->status,
            'featured' => (bool) $this->is_featured,
            'date' => $this->published_at?->toDateString(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'publishedAt' => $this->published_at?->toIso8601String(),
            $this->mergeWhen(
                (bool) $request->user()?->can('manage', $this->resource),
                [
                    'createdBy' => $this->creator?->full_name,
                    'updatedBy' => $this->updater?->full_name,
                ]
            ),
        ];
    }
}
