<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes','string','max:255'],
            'content' => ['sometimes','string'],

            'audience' => [
                'sometimes',
                'string',
                Rule::in([
                    'todos',
                    'docentes',
                    'estudiantes',
                    'apoderados',
                    'seccion_especifica'
                ])
            ],

            'section_id' => ['sometimes','nullable','uuid','exists:sections,id'],
        ];
    }
}
