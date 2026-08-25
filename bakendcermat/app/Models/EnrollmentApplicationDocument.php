<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EnrollmentApplicationDocument extends Model
{
    use HasUuids;

    protected $table = 'enrollment_application_documents';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'enrollment_application_id',
        'document_type_id',
        'delivered',
        'delivered_at',
        'notes',
        'updated_by',
    ];

    protected $casts = [
        'delivered' => 'boolean',
        'delivered_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(EnrollmentApplication::class, 'enrollment_application_id');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }
}
