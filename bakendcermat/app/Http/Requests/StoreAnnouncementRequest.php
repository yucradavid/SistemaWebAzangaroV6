<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required','string','max:255'],
            'content' => ['required','string'],

            'audience' => [
                'required',
                'string',
                Rule::in([
                    'todos',
                    'docentes',
                    'estudiantes',
                    'apoderados',
                    'seccion_especifica'
                ])
            ],

            'section_id' => ['nullable','uuid','exists:sections,id'],
        ];
    }
}
