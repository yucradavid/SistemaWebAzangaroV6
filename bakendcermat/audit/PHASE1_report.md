# Fase 1 — Reporte: Seguridad de Acceso

**Fecha**: 2026-05-22
**Rama recomendada**: `audit/remediation`
**Estado**: ✅ Completada (pendiente decisión 1.5)

---

## A. Re-auditoría (antes de editar)

Antes de tocar nada, releí los archivos objetivo. Hallazgos:

### A.1 Default `role='admin'` en AuthController — **CONFIRMADO**

[app/Http/Controllers/Api/AuthController.php:66-75](../app/Http/Controllers/Api/AuthController.php#L66) (pre-edición):

```php
if (!$profile) {
    $profile = Profile::create([
        'id' => (string) $user->id,
        'user_id' => (string) $user->id,
        'role' => 'admin',                  // ⚠️ Fail-open
        'full_name' => $user->name ?? 'Sin nombre',
        'email' => $user->email,
        'is_active' => true,
    ]);
}
```

**Riesgo real**: cualquier registro en `users` sin `profile` correspondiente → escalación a admin al primer login. Explotable si:
- Un usuario fue creado por SQL directo, migración legacy o desde `auth.users` schema (que es el fallback en `syncUserFromAuthSchema`).
- Se borró el Profile pero no el User.

### A.2 Sanctum sin expiración — **CONFIRMADO**

[config/sanctum.php:50](../config/sanctum.php#L50): `'expiration' => null`. Comentario del propio archivo confirma que `null` = sin expiración.

### A.3 Requests financieros con `authorize() { return true; }` — **CONFIRMADO pero RECLASIFICADO**

Revisé [routes/api.php:513-542](../routes/api.php#L513) y descubrí que **el middleware de rol YA protege estas rutas**:

| Ruta | Middleware |
|---|---|
| `POST /charges`, `PUT /charges/{id}` | `role:admin,director,coordinator,secretary,finance` |
| `POST /payments` | `role:admin,director,secretary,finance,cashier` |
| `POST /cash-closures`, `PUT /cash-closures/{id}` | `role:admin,director,secretary,finance,cashier` |

**Reclasificación**: severidad CRÍTICA → MEDIA. No es un agujero explotable hoy; es **defensa en profundidad**. Si alguien mueve la ruta fuera del grupo de middleware en el futuro, el Request quedaría desprotegido. La auditoría inicial sobrestimó el riesgo al no cruzar con `routes/api.php`.

### A.4 Password mínimo 6 — **CONFIRMADO**

[app/Http/Requests/LoginRequest.php:26](../app/Http/Requests/LoginRequest.php#L26).

### A.5 `email_verified_at` autocompletado — **CONFIRMADO**

[app/Services/UserProvisioningService.php:29](../app/Services/UserProvisioningService.php#L29).

**Decisión pendiente del usuario**: este sistema no parece tener flujo de verificación de email implementado (no hay endpoint de verify). Quitarlo rompería el provisioning de usuarios desde admin. Opciones:
- (a) Dejarlo como está (decisión consciente: la verificación se hace por proceso administrativo offline).
- (b) Implementar flujo de verificación real (FASE 6 — out of scope de Fase 1).

**Recomendación**: mantener como está, documentarlo en `audit/known_design_choices.md` cuando lo creemos.

---

## B. Cambios aplicados

### B.1 — `AuthController::login` rechaza usuarios sin Profile

[app/Http/Controllers/Api/AuthController.php:66-83](../app/Http/Controllers/Api/AuthController.php#L66)

- Antes: creaba Profile con `role='admin'` por defecto.
- Después: devuelve 403 con mensaje claro y loggea `Log::warning` con `email` y `user_id` para detectar el evento.
- **Mejora extra mínima**: agregué chequeo de `is_active` (la columna ya existe en Profile). Si está inactivo → 403. No es lógica nueva, es usar un campo existente que estaba sin uso en login.

### B.2 — `config/sanctum.php` expiration configurable

[config/sanctum.php:50](../config/sanctum.php#L50)

- Antes: `'expiration' => null`
- Después: `'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60 * 8)` (default 8h)
- Configurable por env (`SANCTUM_TOKEN_EXPIRATION` en minutos).

### B.3 — Defense-in-depth en 5 Requests financieros

Reemplacé `return true;` por verificación de rol desde `Profile`:

| Archivo | Roles permitidos |
|---|---|
| [StorePaymentRequest.php](../app/Http/Requests/StorePaymentRequest.php) | admin, director, secretary, finance, cashier |
| [StoreChargeRequest.php](../app/Http/Requests/StoreChargeRequest.php) | admin, director, coordinator, secretary, finance |
| [UpdateChargeRequest.php](../app/Http/Requests/UpdateChargeRequest.php) | admin, director, coordinator, secretary, finance |
| [StoreCashClosureRequest.php](../app/Http/Requests/StoreCashClosureRequest.php) | admin, director, secretary, finance, cashier |
| [UpdateCashClosureRequest.php](../app/Http/Requests/UpdateCashClosureRequest.php) | admin, director, secretary, finance, cashier |

Patrón aplicado (inline, sin crear capa nueva):

```php
public function authorize(): bool
{
    $role = optional($this->user()?->profile)->role;
    return in_array($role, ['admin', 'director', ...], true);
}
```

Roles tomados de `routes/api.php` para ser consistentes con el middleware.

### B.4 — `LoginRequest` password mínimo 8

[app/Http/Requests/LoginRequest.php:26](../app/Http/Requests/LoginRequest.php#L26). `min:6` → `min:8`.

⚠️ **Implicación operativa**: cuentas existentes con contraseñas de 6-7 caracteres no podrán loguearse. Decisiones:
- (a) Forzarles a cambiar password al próximo login (necesita flujo nuevo — no implementado).
- (b) Hacer hotfix rebajando a `min:6` y aplicar `min:8` solo a nuevas creaciones de password.
- (c) Aceptar el corte (todas las cuentas con password ≥8 funcionan).

**Si no se sabe la longitud de las passwords actuales, esto puede romper logins en producción.** Confirmar antes de mergear.

---

## C. Hallazgos descartados (falsos positivos / reclasificados)

| ID original | Estado | Razón |
|---|---|---|
| Requests financieros sin auth → **CRÍTICO** | Reclasificado a **MEDIO** | Middleware de rol en `routes/api.php` ya protege. Lo fortalecimos como defensa en profundidad. |

---

## D. Riesgos residuales (NO atendidos en esta fase)

1. **No hay refresh token endpoint**. Con `expiration=480min`, después de 8h el usuario debe re-loguearse. Si quieres "remember me", hay que añadir flujo. → Diferido a FASE 6 si lo requieres.
2. **`UpdatePaymentRequest` no existe** — PaymentController no expone `update`, solo `index/store/show/destroy/void`. No requiere cambio.
3. **Endpoint `void` de Payment y Charge** no usa FormRequest, valida inline en controller. Si quieres hardening, mover a Request → FASE 2.
4. **`syncUserFromAuthSchema`** (AuthController:85-147) hace `updateOrInsert` en tabla `users` desde `auth.users` legacy. Si esta tabla tuviera datos arbitrarios, podría crear users en sistema. Fuera de scope Fase 1.
5. **Logout no revoca tokens en otros dispositivos**. Solo borra el actual. Si compromiso → hay que revocar todos.
6. **`is_active=false` ahora bloquea login** (cambio aditivo en B.1). Si en producción hay perfiles con `is_active=false` que históricamente sí podían loguearse → impacto.

---

## E. Verificación

```
php -l <archivos editados>   →  ✅ todos OK
```

**Pendiente del usuario**:
- Probar manualmente login con una cuenta válida (debe seguir funcionando).
- Probar login con cuenta sin profile (debe devolver 403).
- Confirmar que las cuentas en producción usan password ≥ 8 caracteres.

---

## F. Diff resumen (archivos tocados)

```
modified:   app/Http/Controllers/Api/AuthController.php       (1 bloque, ~14 líneas)
modified:   app/Http/Requests/LoginRequest.php                (1 línea)
modified:   app/Http/Requests/StoreChargeRequest.php          (1 método)
modified:   app/Http/Requests/StoreCashClosureRequest.php     (1 método)
modified:   app/Http/Requests/StorePaymentRequest.php         (1 método)
modified:   app/Http/Requests/UpdateCashClosureRequest.php    (1 método)
modified:   app/Http/Requests/UpdateChargeRequest.php         (1 método)
modified:   config/sanctum.php                                (1 línea)
```

**Total**: 8 archivos, ~25 líneas de código. Sin cambios estructurales. Sin nuevas dependencias. Sin nuevas tablas o migraciones.

---

## G. Checklist para mergear

- [ ] Confirmar que cuentas en producción tienen password ≥ 8 chars (o decidir hotfix).
- [ ] Comunicar al frontend que el token expira en 8h (manejar 401 con redirect a login).
- [ ] Decidir si `SANCTUM_TOKEN_EXPIRATION` debe estar en `.env` de cada entorno o queda con default.
- [ ] Confirmar que no hay Profiles con `is_active=false` que deban poder loguearse.
- [ ] (Opcional) Probar manualmente: login OK, login sin profile, login con profile inactivo.

---

**Siguiente fase**: FASE 2 — Integridad Financiera (numeración recibos, AuditLog en operaciones de dinero, lock de CashClosure post-cierre). Esperando OK del usuario.
