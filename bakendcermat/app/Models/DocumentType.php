<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DocumentType extends Model
{
    use HasUuids;

    protected $table = 'document_types';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'is_required',
        'display_order',
        'is_active',
        'level',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function applicationDocuments()
    {
        return $this->hasMany(EnrollmentApplicationDocument::class);
    }
}
