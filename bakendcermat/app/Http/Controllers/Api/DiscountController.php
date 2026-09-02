<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiscountRequest;
use App\Http\Requests\UpdateDiscountRequest;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $q = Discount::with(['concept', 'academicYear', 'feeConcepts']);

        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('type')) {
            $q->where('type', $request->type);
        }

        if ($request->filled('scope')) {
            $q->where('scope', $request->scope);
        }

        if ($request->filled('academic_year_id')) {
            $q->where('academic_year_id', $request->academic_year_id);
        }

        // ?auto_apply_on=contado para listar solo los automaticos;
        // ?auto_apply_on=manual para listar solo los que se asignan a mano.
        if ($request->filled('auto_apply_on')) {
            if ($request->auto_apply_on === 'manual') {
                $q->whereNull('auto_apply_on');
            } else {
                $q->where('auto_apply_on', $request->auto_apply_on);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        return $q->orderBy('name')->paginate(50);
    }

    public function store(StoreDiscountRequest $request)
    {
        $data = $request->validated();
        $conceptIds = $this->pullFeeConceptIds($data);

        $data['scope'] = $data['scope'] ?? 'todos';
        $data['is_active'] = $data['is_active'] ?? true;

        if ($data['scope'] !== 'especifico') {
            $data['specific_concept_id'] = null;
        }

        $discount = DB::transaction(function () use ($data, $conceptIds) {
            $discount = Discount::create($data);

            if ($conceptIds !== null) {
                $discount->syncFeeConcepts($conceptIds);
            }

            return $discount;
        });

        return response()->json($this->loaded($discount), 201);
    }

    public function show(Discount $discount)
    {
        return $discount->load('concept', 'academicYear', 'feeConcepts', 'studentDiscounts');
    }

    public function update(UpdateDiscountRequest $request, Discount $discount)
    {
        $data = $request->validated();
        $conceptIds = $this->pullFeeConceptIds($data);

        $scope = $data['scope'] ?? $discount->scope;

        if ($scope !== 'especifico') {
            $data['specific_concept_id'] = null;
        }

        DB::transaction(function () use ($discount, $data, $conceptIds) {
            $discount->update($data);

            // Solo se toca la lista si el request la trajo: un PATCH que no
            // menciona fee_concept_ids no debe borrar los conceptos ya
            // configurados.
            if ($conceptIds !== null) {
                $discount->syncFeeConcepts($conceptIds);
            }
        });

        return $this->loaded($discount);
    }

    public function destroy(Discount $discount)
    {
        // Las filas de discount_fee_concepts se borran por FK en cascada.
        $discount->delete();

        return response()->noContent();
    }

    /**
     * Saca fee_concept_ids del payload (no es una columna de discounts) y
     * distingue "no vino" (null) de "vino vacia" (array vacio = limpiar la
     * lista y volver a resolver por scope).
     *
     * @return list<string>|null
     */
    private function pullFeeConceptIds(array &$data): ?array
    {
        if (! array_key_exists('fee_concept_ids', $data)) {
            return null;
        }

        $ids = $data['fee_concept_ids'];
        unset($data['fee_concept_ids']);

        return is_array($ids) ? array_values($ids) : [];
    }

    private function loaded(Discount $discount): Discount
    {
        return $discount->fresh(['concept', 'academicYear', 'feeConcepts']);
    }
}
