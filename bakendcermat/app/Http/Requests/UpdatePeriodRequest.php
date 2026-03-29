<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('period');

        return [
            'academic_year_id' => ['uuid','exists:academic_years,id'],
            'name' => ['string'],
            'period_number' => [
                'integer',
                Rule::unique('periods')
                    ->where(fn($q)=>$q->where('academic_year_id',$this->academic_year_id))
                    ->ignore($id)
            ],
            'start_date' => ['date'],
            'end_date' => ['date','after:start_date'],
            'is_closed' => ['boolean']
        ];
    }
}
