<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', Rule::in(['general', 'tutoria'])],
            'title' => ['nullable', 'string', 'max:255', 'required_if:category,tutoria'],
        ];
    }
}
