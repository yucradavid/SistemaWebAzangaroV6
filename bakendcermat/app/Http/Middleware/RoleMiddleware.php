<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // 1) Si tu rol está en perfil:
        $role = null;
        if (method_exists($user, 'profile')) {
            $role = optional($user->profile)->role;
        }

        // 2) Fallback si lo tienes en la tabla users
        $role = $role ?? ($user->role ?? null);

        if (!$role || !in_array($role, $roles, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
