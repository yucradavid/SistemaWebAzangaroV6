<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * El monto no se puede repartir en la cantidad de cuotas pedida.
 *
 * Es una excepcion de dominio, no una ValidationException de Laravel, para que
 * InstallmentPlanCalculator siga siendo aritmetica pura testeable sin bootear
 * la aplicacion (ValidationException::withMessages() resuelve el facade del
 * validador y revienta con "A facade root has not been set" en un test unitario).
 *
 * render() hace que Laravel la devuelva como 422 con la MISMA forma que un
 * error de validacion normal ({message, errors}), asi el frontend la maneja
 * sin ningun caso especial.
 */
class InstallmentSplitException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $field = 'installments_count'
    ) {
        parent::__construct($message);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'errors' => [$this->field => [$this->getMessage()]],
        ], 422);
    }

    public function errors(): array
    {
        return [$this->field => [$this->getMessage()]];
    }
}
