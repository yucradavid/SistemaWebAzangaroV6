<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskSubmission extends Model
{
    use HasUuids;

    protected $table = 'task_submissions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'assignment_id','student_id','submission_date','content',
        'attachment_url','attachment_name','attachment_size',
        'status','grade','grade_letter','feedback','graded_by','graded_at',
    ];

    protected $casts = [
        'submission_date' => 'datetime',
        'graded_at'       => 'datetime',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
        'attachment_size' => 'integer',
        'grade'           => 'decimal:2',
    ];

public function assignment(): BelongsTo
{
    return $this->belongsTo(Assignment::class, 'assignment_id');
}

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function grader()
    {
        return $this->belongsTo(Profile::class, 'graded_by');
    }

}
