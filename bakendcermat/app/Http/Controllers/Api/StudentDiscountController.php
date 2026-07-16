<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentDiscountRequest;
use App\Http\Requests\UpdateStudentDiscountRequest;
use App\Models\Charge;
use App\Models\StudentDiscount;
use Illuminate\Http\Request;

class StudentDiscountController extends Controller
{
    public function index(Request $request)
    {
        $q = StudentDiscount::with(['student', 'discount', 'academicYear', 'assignedBy']);

        if ($request->filled('student_id')) {
            $q->where('student_id', $request->student_id);
        }

        if ($request->filled('discount_id')) {
            $q->where('discount_id', $request->discount_id);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        return $q->orderByDesc('created_at')->paginate(50);
    }

    public function store(StoreStudentDiscountRequest $request)
    {
        $data = $request->validated();

        $exists = StudentDiscount::where('student_id', $data['student_id'])
            ->where('discount_id', $data['discount_id'])
            ->where('academic_year_id', $data['academic_year_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ese descuento ya fue asignado al estudiante en ese año académico.'
            ], 422);
        }

        $data['assigned_by'] = optional($request->user())->id;
        $data['created_at'] = now();

        $studentDiscount = StudentDiscount::create($data);

        // Al asignar el descuento manualmente, aplicarlo de inmediato a los
        // cargos pendientes existentes del estudiante que coincidan con el
        // scope del descuento. El flujo de generacion masiva (batchStore) ya
        // no aplica descuentos, por lo que esta es la unica via de asignacion.
        $this->applyDiscountToPendingCharges($studentDiscount);

        return response()->json(
            $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']),
            201
        );
    }

    /**
     * Aplica el descuento recien asignado a los cargos pendientes del
     * estudiante en el anio academico, segun el scope del descuento:
     *  - todos       => todos los cargos pendientes
     *  - pension     => solo cargos type = pension
     *  - matricula   => solo cargos type = matricula
     *  - especifico  => solo cargos del concepto especifico
     */
    private function applyDiscountToPendingCharges(StudentDiscount $studentDiscount): void
    {
        $discount = $studentDiscount->discount()->first();

        if (!$discount || !$discount->is_active) {
            return;
        }

        $query = Charge::where('student_id', $studentDiscount->student_id)
            ->where('academic_year_id', $studentDiscount->academic_year_id)
            ->where('status', 'pendiente')
            ->whereNull('voided_at');

        if (in_array($discount->scope, ['pension', 'matricula'], true)) {
            $query->where('type', $discount->scope);
        } elseif ($discount->scope === 'especifico') {
            $query->where('concept_id', $discount->specific_concept_id);
        }
        // scope 'todos': sin filtro adicional, aplica a todos los cargos pendientes.

        foreach ($query->get() as $charge) {
            $amount = (float) $charge->amount;

            $discountAmount = $discount->type === 'porcentaje'
                ? round($amount * ((float) $discount->value) / 100, 2)
                : min((float) $discount->value, $amount);

            $charge->update([
                'discount_amount' => $discountAmount,
                'final_amount' => max(0, $amount - $discountAmount),
            ]);
        }
    }

    public function show(StudentDiscount $studentDiscount)
    {
        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function update(UpdateStudentDiscountRequest $request, StudentDiscount $studentDiscount)
    {
        $studentDiscount->update($request->validated());

        return $studentDiscount->load(['student', 'discount', 'academicYear', 'assignedBy']);
    }

    public function destroy(StudentDiscount $studentDiscount)
    {
        $studentDiscount->delete();
        return response()->noContent();
    }
}
