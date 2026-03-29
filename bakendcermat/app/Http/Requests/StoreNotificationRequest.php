<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid', 'exists:users,id'],

            'type' => [
                'required',
                'string',
                Rule::in([
                    'evaluacion_publicada',
                    'justificacion_aprobada',
                    'justificacion_rechazada',
                    'pago_registrado',
                    'comunicado_nuevo',
                    'tarea_nueva',
                    'recordatorio_pago',
                ])
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in(['no_leida', 'leida'])
            ],

            'title'   => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:2000'],
            'data'    => ['nullable', 'array'],
            'link'    => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Tipo de notificación inválido.',
            'status.in' => 'Estado inválido (no_leida o leida).',
        ];
    }
}
