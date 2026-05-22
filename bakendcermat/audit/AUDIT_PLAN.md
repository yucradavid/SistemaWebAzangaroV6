# Plan de Auditoría y Remediación — SistemaWebAzangaroV6 Backend

> Documento maestro. Cada fase produce su propio `PHASE{N}_report.md` con re-auditoría, cambios aplicados y hallazgos descartados.

---

## Reglas operativas (aplican a TODAS las fases)

1. **Re-auditar antes de tocar**: leer el código actual del archivo objetivo, confirmar que el hallazgo de la auditoría sigue vigente, y registrar el estado real ANTES de editar.
2. **Mínima intervención**: preferir cambios aditivos (validación, middleware, observer, constraint) sobre refactorizar lógica existente. Tocar lógica sólo cuando el bug está EN la lógica misma.
3. **Preservar estructura**: no mover archivos, no renombrar carpetas, no introducir capas nuevas (Services, Repositories, Resources) salvo donde la auditoría lo marcó como crítico.
4. **Reportar antes y después**: cada fase produce un mini-informe en `audit/PHASE{N}_report.md` con: hallazgos confirmados, cambios aplicados, hallazgos rechazados (falsos positivos), riesgos residuales.
5. **Checkpoint humano**: al final de cada fase espero confirmación antes de la siguiente.

---

## FASE 0 — Preparación (sin código)

**Objetivo**: dejar la base lista para trabajar con seguridad.

| Tarea | Por qué |
|---|---|
| Crear rama `audit/remediation` desde `main` | No tocar `main` directo |
| Verificar `.env` (no commitear secretos) | Archivo abierto en el IDE |
| Confirmar que `composer.json:84-86` (`disable-tls`, `secure-http: false`, ruta absoluta a `cafile`) sigue así | Decidir si es solo dev o quitarlo del repo |
| Listar tablas reales en BD vs migraciones (ej. unique constraint de `attendance`) | Las migraciones a veces no reflejan el estado real |
| Ejecutar `php artisan route:list` y guardar snapshot | Detectar rutas no auditadas |
| Resolver `personal_access_tokens` migration eliminada del `git status` | Sanctum la necesita |

**Entregable**: `audit/PHASE0_baseline.md` con el estado actual.

---

## FASE 1 — Seguridad de Acceso (CRÍTICA, máx 1 día)

> Las 3 puertas abiertas: rol admin por defecto, tokens eternos, requests sin authorize.

**Re-auditar**: confirmar en código que [AuthController.php:66-77](../app/Http/Controllers/Api/AuthController.php#L66) sigue creando Profile con `role='admin'` por defecto, y revisar `config/sanctum.php` por si ya hay expiración configurada.

| # | Cambio | Tipo |
|---|---|---|
| 1.1 | Quitar default `role='admin'` en login → rechazar con 403 si no existe Profile | **Lógica mínima**, comportamiento de seguridad |
| 1.2 | Configurar `'expiration' => 60*8` (8h) en `config/sanctum.php` + variable env | **Aditivo** (config) |
| 1.3 | Reemplazar `authorize() { return true; }` por verificación de rol en `StorePaymentRequest`, `StoreChargeRequest`, `UpdateChargeRequest`, `StoreCashClosureRequest`, `UpdateCashClosureRequest` | **Aditivo** (defensa en profundidad) |
| 1.4 | Subir mínimo de password a 8 en `LoginRequest` | **Aditivo** |
| 1.5 | Bloquear `email_verified_at` autocompletado en `UserProvisioningService:29` o documentar excepción | Decisión con el usuario |

**Entregable**: `PHASE1_report.md` con diff por punto + lista de endpoints que ahora devuelven 403.

---

## FASE 2 — Integridad Financiera (CRÍTICA, 2-3 días)

> Numeración de recibos, floats, cierre de caja editable, sin auditoría.

**Re-auditar**: leer [Receipt.php:84-100](../app/Models/Receipt.php#L84) y confirmar el driver de BD (probablemente PostgreSQL — si es así, el problema #7 baja a Bajo). Releer [CashClosureController.php:82-109](../app/Http/Controllers/Api/CashClosureController.php#L82).

| # | Cambio | Tipo |
|---|---|---|
| 2.1 | Si la BD es PostgreSQL → bajar prioridad. Si hay sqlite en tests → forzar `pg_advisory_xact_lock` o `SELECT ... FOR UPDATE` también para no-PG | **Lógica mínima** en `Receipt::nextNumber()` |
| 2.2 | Bloquear `PUT/DELETE /cash-closures/{id}` para no-superadmin, exigir motivo, registrar en AuditLog | **Aditivo** (middleware + Request) |
| 2.3 | Invocar `AuditLogger::log()` en `store/update/destroy` de Payment, Charge, CashClosure | **Aditivo** mínimo en controllers |
| 2.4 | **DECISIÓN PENDIENTE**: convertir floats → enteros (centavos) o `BCMath`. Es un cambio amplio → propongo aislarlo en FASE 2b o postponer | **Toca lógica** — requiere tu OK |

**Entregable**: `PHASE2_report.md`. La 2.4 puede dividirse en su propia fase si no quieres impactar tanto.

---

## FASE 3 — Seguridad QR de Asistencia (ALTA, 1-2 días)

> Token nunca validado, sin anti-replay, sin firma.

**Re-auditar**: confirmar en [AttendanceQrSession.php:24,214](../app/Models/AttendanceQrSession.php#L24) que el `token` se sigue generando pero no se usa. Mirar el payload del QR.

| # | Cambio | Tipo |
|---|---|---|
| 3.1 | Incluir `token` (no solo `session_code`) en el payload del QR + validar `token` en `selfCheckpoint` | **Aditivo** (usa campo existente en BD) |
| 3.2 | Agregar firma HMAC al payload con `config('app.key')` | **Aditivo** |
| 3.3 | Constraint único `(student_id, qr_session_id)` en `attendance_daily_records` → prevenir doble escaneo | **Migración aditiva** |
| 3.4 | Agregar `unique(student_id, course_id, date)` real a `attendance` | **Migración aditiva** |
| 3.5 | Job programado para cerrar sesiones QR expiradas | **Aditivo** (nuevo Job + schedule) |

**Entregable**: `PHASE3_report.md` + nota al equipo de frontend móvil sobre nuevo formato de QR payload.

---

## FASE 4 — Integridad Académica (MEDIA-ALTA, 2 días)

> Transacciones faltantes, autorización ausente en endpoints de lectura.

**Re-auditar**: confirmar las 3 operaciones en [AcademicEvaluationService.php:31-48](../app/Services/AcademicEvaluationService.php#L31) y verificar si `DescriptiveConclusionController::index` y `StudentFinalStatusController::index` siguen sin scope.

| # | Cambio | Tipo |
|---|---|---|
| 4.1 | Envolver `recalculateStudentYear()` en `DB::transaction(fn() => …)` | **Aditivo** |
| 4.2 | Agregar Policy + `authorizeResource` en `DescriptiveConclusionController` y `StudentFinalStatusController` | **Aditivo** |
| 4.3 | Revalidar competencia∈curso en `UpdateEvaluationRequest` (copiar regla de `Store…Request`) | **Aditivo** |
| 4.4 | **DECISIÓN PENDIENTE**: consolidar `course_assignments` vs `teacher_course_assignments` — solo **documentar cuál usar dónde** en FASE 4 y diferir consolidación | **Toca estructura** — requiere tu OK |

**Entregable**: `PHASE4_report.md`.

---

## FASE 5 — Comunicación, Tareas y Archivos (MEDIA, 1-2 días)

| # | Cambio | Tipo |
|---|---|---|
| 5.1 | Validar MIME/tamaño en `StoreTaskSubmissionRequest`, `StoreAssignmentRequest`, `StorePublicNewsRequest` | **Aditivo** |
| 5.2 | Mover notificaciones síncronas (Announcement/Message) a Job `ShouldQueue` | **Refactor mínimo** |
| 5.3 | Lock de edición de `TaskSubmission` después de `due_date` | **Aditivo** |
| 5.4 | Investigar redundancia `TaskSubmission` vs `AssignmentSubmission` → solo **documentar diferencia** | **Sin cambios de código** |

**Entregable**: `PHASE5_report.md`.

---

## FASE 6 — Cross-cutting (BAJA, 1-2 días)

| # | Cambio | Tipo |
|---|---|---|
| 6.1 | Registrar Observer global de `AuditLog` para User/Profile/Student/Payment/Charge/CashClosure | **Aditivo** |
| 6.2 | Soft deletes en modelos críticos donde haga sentido | **Migración aditiva** |
| 6.3 | Tests mínimos para flujos críticos: login, payment, QR | **Aditivo** |
| 6.4 | Limpiar `composer.json` (cafile, disable-tls) o aislar a `.env` local | **Limpieza** |

**Entregable**: `PHASE6_report.md` + suite de tests inicial.

---

## Lo que NO voy a tocar (por restricción de "no editar lógica salvo necesario")

- Cálculo de promoción/recuperación en `AcademicEvaluationService` — solo se envuelve en transacción.
- Estructura de modelos (no se renombra ni fusiona `TaskSubmission` con `AssignmentSubmission`).
- Función SQL `approve_enrollment_application()` — se documenta pero no se reescribe.
- `BulkImportService` — la lógica de import se mantiene.

---

## Decisiones pendientes del usuario

1. **Fase 2.4 (floats → centavos)**: ¿ahora o aislada en su propia fase futura?
2. **Fase 4.4 (consolidar tablas de asignación)**: ¿documentar y postergar, o atacar?
3. **Composer**: ¿`disable-tls`/`secure-http` siguen siendo necesarios?

---

## Índice de reportes

- [PHASE1_report.md](PHASE1_report.md) — Seguridad de acceso
- PHASE2_report.md — _(pendiente)_
- PHASE3_report.md — _(pendiente)_
- PHASE4_report.md — _(pendiente)_
- PHASE5_report.md — _(pendiente)_
- PHASE6_report.md — _(pendiente)_
