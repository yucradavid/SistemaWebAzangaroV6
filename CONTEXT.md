# CONTEXTO DEL PROYECTO: SistemaWebAzangaroV6 (Colegio CERMAT)

## 1. Stack Técnico Verificado
- **Backend:** Laravel 12.x (`laravel/framework ^12.0`) | PHP 8.2+ (`^8.2`) | PostgreSQL
- **Frontend:** Angular 18.2.x (`^18.2.0`) (Arquitectura Standalone Components) | Tailwind CSS 3.4.x (`^3.4.19`)
- **Autenticación:** Laravel Sanctum (`laravel/sanctum ^4.0`) con tokens Bearer API.
- **Estilos / Design System:** Paleta institucional `cermat-blue` (`#1e3a8a` / HSL tailoring), `cermat-red`. Regla UI actual: KPIs horizontales tipo chips / badges compactos (no cards gigantes).

## 2. Mapa de Arquitectura y Rutas

### Backend (`bakendcermat/`)
- **Arquitectura:** Controlador-Servicio-Modelo RESTful en Laravel. FormRequests para validaciones estrictas y Eloquent ORM.
- **Resumen de Endpoints en `routes/api.php`:**
  - **Públicos (Sin Auth):**
    - `POST /api/login` (rate limited)
    - `GET /api/public/enrollment-options` & `POST /api/public/enrollment-applications`
    - `GET /api/public/guardian-lookup` (DNI lookup apoderados)
    - `GET /api/public/news` & `GET /api/public/news/{slug}`
  - **Autenticación & Sesión (`auth:sanctum`):**
    - `GET /api/me` | `GET /api/me/academic-context` | `POST /api/logout`
  - **Dashboard Administrativo:**
    - `GET /api/dashboard` (acceso: admin, director, coordinator, secretary)
  - **Módulo Académico & Catálogos:**
    - `apiResource('academic-years')` | `apiResource('grade-levels')` | `apiResource('sections')` | `apiResource('courses')`
    - `GET|POST|PUT|DELETE /api/periods` & `GET /api/periods/{period}/history`
    - `apiResource('competencies')` | `apiResource('promotion-rules')`
  - **Módulo Personas & Usuarios:**
    - `apiResource('profiles')` | `apiResource('students')` | `apiResource('teachers')` | `apiResource('guardians')` | `apiResource('student-guardians')`
    - `GET|POST|DELETE /api/users` | `POST /api/bulk-import/{type}`
  - **Módulo Horarios y Asignaciones:**
    - `GET|POST|PUT|DELETE /api/course-schedules`
    - `GET|POST|PUT|DELETE /api/course-assignments`
  - **Módulo Matrículas:**
    - `apiResource('enrollment-applications')` + Endpoints `approve`, `provision-accounts`, `reject`
    - `GET|POST|PUT|DELETE /api/teacher-course-assignments`
    - `GET|POST|PUT|DELETE /api/student-course-enrollments`
  - **Módulo Asistencia & Justificaciones:**
    - `GET /api/attendance/admin-overview` | `GET /api/attendance/my-context` | `POST /api/attendance/batch` | `apiResource('attendance')`
    - `GET|POST /api/attendance/daily` | `POST /api/attendance/daily/batch`
    - `GET|POST /api/attendance/daily/qr-sessions` & `POST /api/attendance/daily/qr-sessions/{id}/close`
    - `POST /api/attendance/daily/self-checkpoint` (estudiantes/docentes QR)
    - `apiResource('attendance-justifications')` + `approve` / `reject`
  - **Módulo Evaluaciones & Notas:**
    - `GET /api/evaluations/my-context` | `GET|POST|PUT|DELETE /api/evaluations`
    - `POST /api/evaluations/{id}/publish` | `close` | `draft`
    - `apiResource('evaluation-reopen-requests')` + `approve` / `reject`
    - `apiResource('descriptive-conclusions')` | `final-competency-results` | `student-final-statuses`
    - `apiResource('recovery-processes')` | `recovery-results`
    - Recálculo de promedios: `academic-years/{year}/students/{student}/evaluation-summary/recalculate`
  - **Módulo Finanzas:**
    - `apiResource('fee-concepts')` | `apiResource('charges')` (incluye `POST charges/batch` y `POST charges/{id}/void`)
    - `apiResource('payments')` (incluye `POST payments/{id}/void`) | `apiResource('receipts')`
    - `apiResource('discounts')` | `apiResource('student-discounts')`
    - `apiResource('financial-plans')` | `apiResource('plan-installments')`
    - `apiResource('cash-closures')` (cierres de caja diarios)
  - **Módulo Reportes:**
    - Boleta de notas: `GET /api/reports/students/{student}/report-card`
    - Asistencia: `GET /api/reports/students/{student}/attendance` & `sectionAttendanceSummary`
    - Resumen Financiero: `GET /api/reports/students/{student}/financial`
  - **Módulo Comunicación & Auditoría:**
    - `apiResource('announcements')` + `request-approval`, `approve`, `archive`
    - `apiResource('messages')` | `GET|PUT|DELETE /api/notifications`
    - `GET /api/audit-logs`

### Frontend (`sistema-educativo-frontend/`)
- **Arquitectura:** Componentes Standalone de Angular 18 con inyección de servicios HTTP centralizados en `core/services/`.
- **Estructura por Roles (`src/app/features/`):**
  - `admin/`: Dashboards, matrículas, admisiones, gestión de asistencia, evaluaciones, finanzas (tabs: conceptos, planes, descuentos, caja), horarios, comunicaciones, reportes y configuración.
  - `teacher/`: Dashboard docente, marcado/registro de asistencia (QR/manual), ingreso de notas por competencia, solicitudes de reapertura de evaluacion, tareas, horarios y mensajería.
  - `student/`: Dashboard estudiante, mi asistencia y autoservicio QR (self-checkpoint), mis calificaciones / boleta, mis tareas y horario.
  - `apoderado/`: Dashboard apoderado, consulta de notas y asistencia por hijo (con `student.guardian.access`), justificación de faltas, estado financiero de pensiones y mensajería con docentes.
  - `public/`: Formulario público de postulación e inscripción en línea, portal de noticias públicas.
  - `auth/`: Inicio de sesión y manejo de credenciales/tokens Sanctum.

---

## 3. Estado de Avance por Módulo
- **Matrículas (100% Implementado):** Formulario público con autocompletado / validación DNI apoderado, detección inteligente de hermanos, revisión administrativa con aprobación/rechazo, provisión automática de cuentas de usuario y asignación a sección.
- **Asistencia QR (100% Implementado):** Generación de QR único para alumno/docente, sesiones activas de lectura QR (`createQrSession`/`closeQrSession`), escaneo vía cámara (`@zxing/ngx-scanner`), autoservicio `self-checkpoint`, y módulo de justificaciones con flujo de aprobación.
- **Evaluaciones (100% Implementado):** Escala cualitativa EBR (`AD`, `A`, `B`, `C`) y vigesimal (`0-20`), evaluación por competencias MINEDU, conclusiones descriptivas, recálculo de situación final y flujo formal de reapertura de notas en ventana de 24h (`evaluation-reopen-requests`).
- **Finanzas (100% Implementado):** UI en Tabs (Conceptos, Planes Financieros, Descuentos). Generación masiva de cobros por cuotas de plan (`batchStore`), anulaciones auditadas vía timestamp `voided_at` (cargos y pagos), cierres diarios de caja (`cash-closures`) y asignación manual de descuentos por alumno.
- **Configuración Académica (100% Implementado):** Administración de Años Académicos, Periodos (Bimestres/Trimestres), Grados, Secciones, Cursos, Horarios y regeneración de snapshots de historial de periodos (`PeriodHistoryService`).
- **Notificaciones & Comunicación (100% Implementado):** Campana de notificaciones en el Navbar con contador no leídos y marcado masivo (`markAllAsRead`), sistema de anuncios con flujo de solicitud/aprobación y mensajería directa interna.

---

## 4. Matriz de Permisos por Rol (RBAC)

| Módulo / Operación | Admin | Director | Coordinator | Secretary | Teacher | Student | Guardian |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Años / Grados / Secciones / Cursos** | CRUD | CRUD | CRUD | CRUD | Lectura | Lectura | Lectura |
| **Gestión de Usuarios / Perfiles / Alumnos** | CRUD | CRUD | CRUD | CRUD | Lectura | Lectura (propia) | Lectura (hijos) |
| **Aprobación de Matrículas** | Full | Full | Full | Full | - | - | - |
| **Horarios / Asignación Docente** | CRUD | CRUD | CRUD | CRUD | Lectura | Lectura | Lectura |
| **Registro de Asistencia Manual / QR** | Full | Full | Full | Full | Asignados | Self-QR | - |
| **Aprobación de Justificaciones Faltas** | Full | Full | Full | Full | Lectura | - | Crear |
| **Evaluaciones / Registro de Notas** | Full | Full | Full | Full | Asignados | Lectura | Lectura |
| **Solicitud de Reapertura de Notas** | Aprobar | Aprobar | Aprobar | - | Solicitar | - | - |
| **Cobros / Pagos / Recibos / Caja** | Full | Full | CRUD | CRUD | - | - | Lectura (hijos) |
| **Anulación Financiera (`voided_at`)** | Sí | Sí | Sí | Sí | - | - | - |
| **Publicación de Anuncios** | Full | Full | Full | Full | Propios | Lectura | Lectura |
| **Auditoría de Sistema (`audit-logs`)** | Ver | Ver | - | - | - | - | - |

---

## 5. Verificación de Reglas Críticas del Negocio
- [x] **FKs correctas hacia `public.users` (0 referencias activas a `auth.users` en esquema relacional):** Migración `2026_06_14_000003_migrate_orphan_users_and_fix_remaining_fks.php` reasoció todas las Foreign Keys residuales (`students.user_id`, `guardians.user_id`, `evaluations.recorded_by`, `charges.created_by`) hacia `public.users`.
- [x] **Roster de notas vía `student_course_enrollments ⋈ teacher_course_assignments`:** `EvaluationController` y `AcademicEvaluationController` validan la inscripción activa del estudiante en la combinación curso/sección/año y la asignación docente, previniendo depender ciegamente de `students.section_id`.
- [x] **Secciones/Períodos aislados por año (`year-scoped`):** Controladores y servicios aplican y validan explícitamente el scope por `academic_year_id` en consultas y registros.
- [x] **Finanzas usa `voided_at` para anulaciones:** La anulación en `ChargeController` y `PaymentController` asigna `voided_at = now()`, `voided_by` y `void_reason` sin corromper el campo `status` a valores inválidos.
- [x] **Descuentos manuales en `batchStore`:** En `ChargeController::batchStore()`, `discount_amount` se fija explícitamente en `0.0` para obligar a que los descuentos se gestionen individualmente mediante `StudentDiscountController`.

---

## 6. Inconsistencias Detección y Puntos de Mejora
1. **Residuo de Supabase en `EvaluationController::resolveRecorderId()`:** IGNORADO TEMPORALMENTE (Entorno de Desarrollo): Se mantiene el fallback a auth.users por convivencia híbrida con Supabase durante el desarrollo. Se deberá eliminar antes de pasar a Producción.
2. **Homogeneidad UI / KPIs:** Mantener el estándar visual en todos los dashboards (Admin, Docente, Apoderado, Alumno) usando los indicadores KPI horizontales compactos estilo chips/badges con la paleta `cermat-blue` / `cermat-red`.
