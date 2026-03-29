# Solución de Problemas - Vista de Estudiante

## Problema
Los estudiantes no pueden ver sus tareas ni asistencias en el sistema.

## Causa
Los estudiantes no están matriculados en los cursos de su sección. El sistema requiere que cada estudiante esté explícitamente matriculado en los cursos mediante la tabla `student_course_enrollments`.

## Solución

### Paso 1: Ejecutar el script de sincronización

En el SQL Editor de Supabase, ejecuta el siguiente archivo:
```
supabase/migrations/sync_student_enrollments.sql
```

Este script:
- Matricula automáticamente a todos los estudiantes activos
- Los inscribe en los cursos que tienen asignados docentes en su sección
- Evita duplicados si ya existen matrículas

### Paso 2: Verificar las matrículas

Ejecuta esta consulta para verificar:

```sql
SELECT 
  s.student_code,
  s.first_name,
  s.last_name,
  c.name as course_name,
  gl.name as grade,
  sec.section_letter
FROM student_course_enrollments sce
JOIN students s ON s.id = sce.student_id
JOIN courses c ON c.id = sce.course_id
JOIN sections sec ON sec.id = sce.section_id
JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE sce.status = 'active'
ORDER BY s.last_name, c.name;
```

### Paso 3: Refrescar la aplicación

Una vez ejecutado el script:
1. Los estudiantes deben cerrar sesión y volver a iniciar
2. O simplemente refrescar la página (F5)
3. Ahora deberían ver:
   - Sus tareas asignadas en el módulo de Tareas
   - Su historial de asistencias en el módulo de Asistencia

## Cambios Realizados en el Código

### 1. StudentTasksPage.tsx
- Ahora consulta `student_course_enrollments` para obtener los cursos del estudiante
- Solo muestra tareas de los cursos en los que está matriculado
- Filtra por año académico activo

### 2. StudentAttendancePage.tsx
- Mantiene la consulta directa por `student_id` (correcto)
- La asistencia se registra por estudiante, no requiere enrollment previo

### 3. TeacherDashboard.tsx
- Corregido el conteo de tareas pendientes
- Ahora usa la relación correcta: `assignments` → `task_submissions`
- Muestra valores reales en lugar de "-"

## Proceso Automático de Matrícula

Cuando un administrador:
1. Asigna un docente a un curso/sección (`teacher_course_assignments`)
2. Todos los estudiantes de esa sección se matricularán automáticamente

**Nota:** Si agregas nuevos estudiantes o nuevas asignaciones de docentes, ejecuta nuevamente el script `sync_student_enrollments.sql`.

## Verificación Rápida

Para verificar si un estudiante específico está matriculado:

```sql
SELECT 
  c.name as course,
  c.code,
  sce.status,
  sce.enrollment_date
FROM student_course_enrollments sce
JOIN courses c ON c.id = sce.course_id
JOIN students s ON s.id = sce.student_id
WHERE s.student_code = 'EST-2025-001'; -- Cambiar por el código del estudiante
```
