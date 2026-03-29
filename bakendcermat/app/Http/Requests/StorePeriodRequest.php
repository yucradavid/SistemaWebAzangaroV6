<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required','uuid','exists:academic_years,id'],
            'name' => ['required','string'],
            'period_number' => [
                'required','integer',
                Rule::unique('periods')
                    ->where(fn($q)=>$q->where('academic_year_id',$this->academic_year_id))
            ],
            'start_date' => ['required','date'],
            'end_date' => ['required','date','after:start_date'],
            'is_closed' => ['boolean']
        ];
    }
}
