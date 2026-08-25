<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SitePageCover extends Model
{
    use HasUuids;

    protected $table = 'site_page_covers';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'page_key',
        'image_path',
        'alt_text',
        'object_position',
        'updated_by',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
