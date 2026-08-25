# Traspaso — Sistema de Horarios Configurables, Turnos, QR de Estudiantes y Notificaciones de Asistencia

Rama: `feature/promocion-y-pendientes`. Prioridad crítica — presentación en
2 días.

⚠️ **Antes de que otra herramienta toque código:** hacer
`git pull origin feature/promocion-y-pendientes` primero y confirmar con
`git log -1 --oneline` que coincide con el remoto. Al terminar, auditar el
diff real línea por línea antes de comitear (mismo criterio ya usado con
éxito en sesiones anteriores — la vez que no se sincronizó primero causó
un bug real de cargos duplicados en producción).

---

## Contexto de negocio (reglas confirmadas)

- El QR/checkpoint de **docente** ya existe y funciona (turno mañana/tarde
  vía `teacher-mark-attendance`, reconectado en esta sesión) — **no se
  toca**.
- Rol del auxiliar que marca asistencia de estudiantes: reusar
  `administrative` (ya existe en el enum de roles, sin migración nueva).
- Horarios **no son absolutos fijos en código** — deben ser configurables
  por el admin, con estos valores como default:
  - Turno mañana, entrada: temprano 07:00-08:15, tarde 08:15-10:00
  - Turno mañana, salida: 13:30-14:30
  - Turno tarde, entrada: temprano 15:00-15:30, tarde 15:30-16:00
  - Turno tarde, salida: 17:00 normal, hasta 19:00 con tolerancia para
    estudiantes de taller
- Turnos (mañana/tarde) son **flexibles**, no fijos por grado — el admin
  asigna qué secciones y qué docentes van en cada turno, editable en
  cualquier momento.
- QR de estudiante: **único y permanente** por alumno (basado en
  `student_code`, que ya existe y ya es único). Se genera una sola vez y
  dura indefinidamente — el sistema **nunca** obliga a regenerarlo.
- Regenerar QR es una función **opcional**, disponible para 2 casos reales:
  1. Individual — carnet perdido/dañado/sospecha de fraude, con motivo
     obligatorio.
  2. Masivo — por sección, grado, nivel, o todo el colegio, para el caso
     de que el colegio decida renovar carnets algún año. Con doble
     confirmación si el alcance es "todo el colegio".
  - Nada dispara la regeneración automáticamente — siempre es una acción
    explícita del admin.
- Al registrar tardanza o falta, debe notificarse automáticamente al
  **portal del apoderado** (reutilizando el patrón ya construido de
  `message_recipients` + notificaciones, el mismo usado para Tutoría
  Académica y Escuela Vacacional).
- Envío por **WhatsApp**: sigue siendo 100% manual vía `wa.me` (sin API de
  pago) — no existe un "enviar a todos con 1 click real", es una **cola**
  de envíos que se abren uno por uno, cada uno en su propia pestaña. Debe
  aclararse esto en la UI para no generar expectativas equivocadas.

---

## Qué ya existía antes de esta tarea (confirmado, no reconstruir)

- `DailyAttendanceController::selfCheckpoint()` y
  `DailyAttendanceService` — ya calculan presente/tarde por QR para
  docentes, middleware ya incluye `role:student,teacher`. La lógica de
  cálculo está **duplicada** entre estos dos archivos (mismo cómputo
  copiado) — extraerla a un método compartido al reutilizarla.
- No existía ningún sistema de carnet/QR por estudiante (búsqueda
  exhaustiva confirmó 0 resultados).
- No existía ningún horario absoluto de reloj hardcodeado — el sistema
  actual es relativo a cuándo se abre la sesión QR (`late_after_minutes`
  por sesión, sin default global configurable).
- Patrón de configuración editable por admin ya existente:
  `system_settings` (tabla clave-valor genérica, usada hoy solo para
  `max_courses_per_teacher`) — **no** se reutiliza tal cual para horarios
  porque necesitan más estructura (turno + checkpoint + rangos), se crea
  tabla dedicada `attendance_schedule_config` en su lugar.
- Módulo "Marcar Asistencia" del docente estaba huérfano (código completo
  desde junio, nunca enlazado al menú) — ya reconectado en esta sesión.

---

## Qué falta implementar (el prompt completo, por bloques)

### PASO 0 — Investigación previa
Confirmar estructura de `sections`/`students`/`teachers` para decidir
dónde vive el campo de turno, y confirmar que `student_code` es apto como
base del QR.

### PARTE 1 — Backend: Configuración de horarios
Tabla `attendance_schedule_config` (shift, checkpoint_type, early_start,
early_end, late_end, taller_tolerance_minutes, is_active). Seed con los
defaults de arriba. CRUD protegido por rol admin.

### PARTE 2 — Backend: Asignación de turnos
Columna `shift` en `sections`. Tabla `teacher_shift_assignments`.
Endpoints para listar/cambiar turno de secciones y docentes por lote.

### PARTE 3 — Backend: QR permanente (generación normal)
Columna `attendance_qr_code` (único, nullable) en `students`, basada en
`student_code`. Endpoint que SOLO crea código para quien no tiene, nunca
sobrescribe. Verificar idempotencia con prueba real.

### PARTE 3B — Backend: PDF imprimible tipo carnet
Endpoint que genera 1 fotocheck por estudiante (nombre, DNI,
grado+sección, QR), reutilizando el patrón ya usado para recibos (HTML +
estilos, sin librería nueva).

### PARTE 3C — Backend: Regenerar QR (opcional)
Endpoint que SÍ sobrescribe, solo por acción explícita. Body con
`student_ids` o `scope` (nivel/grado/sección) + `reason` obligatorio.
Tabla de historial `qr_regeneration_log`. Endpoint de preview con conteo
antes de ejecutar.

### PARTE 4 — Backend: Registrar asistencia por QR/código + notificación
Endpoint `checkpoint-by-code` — busca por `attendance_qr_code`, resuelve
turno vía sección, consulta `attendance_schedule_config`, calcula status
(reutilizando la lógica extraída de duplicación). Al resultar "tarde":
notificación inmediata al portal. Comando artisan que corra después del
rango de "tarde" de cada turno y marque "falta" a quien no registró nada.

### PARTE 5 — Frontend: 4 pestañas en `/app/attendance/approvals`
"Configuración de Horarios", "Asignar Turnos", "Generar QR" (con
filtros, selección individual/varios/todos, badges de estado, exportar
PDF, sección de regenerar con alertas escalonadas), "Marcar Asistencia
Estudiantes" (escaneo QR + código manual de respaldo). Todo responsive.

### PARTE 6-7 — Frontend: Botones de WhatsApp
En la vista de asistencia del día: botón individual por fila T/F, y
botón superior de "cola" de notificación (aclarando en la UI que es
manual asistido, no masivo real). Marcar visualmente quién ya fue
notificado.

### PARTE 8 — Prueba con 2 números de WhatsApp reales
2 estudiantes de prueba con apoderados de números reales distintos.
Confirmar que cada wa.me individual tiene el número/mensaje correcto sin
mezclarse, y que la cola de "notificar a todos" abre las pestañas
correctas. Limpiar datos de prueba al terminar.

---

## Restricciones que se mantienen

- QR de docente NO se toca.
- "Generar QR" nunca sobrescribe — solo "Regenerar" (explícito) lo hace.
- Regenerar "todo el colegio" requiere doble confirmación.
- Extraer la lógica de cálculo de status duplicada a un método
  compartido en vez de triplicarla.
- Responsive en todo lo nuevo.
- `php -l` y `ng build` sin errores en cada bloque.
- Reportar por bloques (no todo junto) — verificar sobre la marcha dado
  el tiempo limitado.
