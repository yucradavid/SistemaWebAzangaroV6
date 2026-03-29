<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentGuardianAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $role = optional($user->profile)->role;

        // admins/autoridades/teachers pasan normal
        if (in_array($role, ['admin','director','coordinator','secretary','teacher'], true)) {
            return $next($request);
        }

        $studentIdParam = $request->route('student'); // {student} en ruta
        $studentId = is_object($studentIdParam) ? $studentIdParam->id : $studentIdParam;

        // Student: solo su propio student_id (si students.user_id existe)
        if ($role === 'student') {
            $ok = DB::table('students')
                ->where('id', $studentId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$ok) return response()->json(['message' => 'Forbidden'], 403);
            return $next($request);
        }

        // Guardian: solo hijos por student_guardians (si guardians.user_id existe)
        if ($role === 'guardian') {
            $guardian = DB::table('guardians')->where('user_id', $user->id)->first();
            if (!$guardian) return response()->json(['message' => 'Forbidden'], 403);

            $ok = DB::table('student_guardians')
                ->where('guardian_id', $guardian->id)
                ->where('student_id', $studentId)
                ->exists();

            if (!$ok) return response()->json(['message' => 'Forbidden'], 403);
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }
}
