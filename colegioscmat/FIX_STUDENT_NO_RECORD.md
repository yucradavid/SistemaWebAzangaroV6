# Solución: Estudiante no puede ver cursos ni asistencias

## Error Detectado
```
No student record found for this user
```

Esto significa que el usuario tiene un perfil (`profiles`) con rol `student`, pero **no está vinculado** a un registro en la tabla `students`.

## Diagnóstico

### Paso 1: Identificar el email del estudiante
Cuando el estudiante inicia sesión, obtén su email. Por ejemplo: `estudiante@cermatschool.edu.pe`

### Paso 2: Ejecutar en SQL Editor de Supabase

```sql
-- 1. Buscar el perfil del estudiante
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'estudiante@cermatschool.edu.pe';
-- Anota el 'id' del perfil
```

```sql
-- 2. Buscar si existe un registro de estudiante sin vincular
SELECT id, student_code, first_name, last_name, user_id, section_id
FROM students
WHERE user_id IS NULL
ORDER BY created_at DESC;
-- Identifica qué estudiante debería ser
```

### Paso 3: Vincular el perfil con el estudiante

**Opción A: Si ya existe un registro en `students` sin `user_id`**

```sql
UPDATE students 
SET user_id = 'UUID_DEL_PERFIL'  -- El ID que obtuviste del paso 1
WHERE student_code = 'EST-2025-XXX';  -- O usa: id = 'UUID_DEL_ESTUDIANTE'
```

**Opción B: Si NO existe registro en `students`, créalo**

```sql
-- Primero obtén el section_id de la sección correcta
SELECT s.id, gl.name || ' - Sección ' || s.section_letter as section_name
FROM sections s
JOIN grade_levels gl ON gl.id = s.grade_level_id
JOIN academic_years ay ON ay.id = s.academic_year_id
WHERE ay.is_active = true;

-- Luego crea el estudiante
INSERT INTO students (
  user_id,
  student_code,
  first_name,
  last_name,
  section_id,
  status
) VALUES (
  'UUID_DEL_PERFIL',           -- Del paso 1
  'EST-2025-XXX',               -- Código único del estudiante
  'Nombre',
  'Apellidos',
  'UUID_DE_LA_SECCION',        -- De la consulta anterior
  'active'
);
```

### Paso 4: Matricular al estudiante en cursos

Una vez vinculado, ejecuta el script de sincronización:

```sql
-- Este script matricula al estudiante en todos los cursos de su sección
INSERT INTO student_course_enrollments (
  student_id,
  course_id,
  section_id,
  academic_year_id,
  enrollment_date,
  status
)
SELECT DISTINCT
  s.id as student_id,
  tca.course_id,
  s.section_id,
  tca.academic_year_id,
  CURRENT_DATE as enrollment_date,
  'active' as status
FROM students s
JOIN teacher_course_assignments tca ON tca.section_id = s.section_id
WHERE 
  s.user_id = 'UUID_DEL_PERFIL'  -- Del paso 1
  AND s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM student_course_enrollments sce
    WHERE sce.student_id = s.id
      AND sce.course_id = tca.course_id
  );
```

### Paso 5: Verificar

```sql
-- Ver el estudiante vinculado
SELECT 
  p.email,
  s.student_code,
  s.first_name || ' ' || s.last_name as nombre,
  sec.section_letter,
  gl.name as grado
FROM profiles p
JOIN students s ON s.user_id = p.id
JOIN sections sec ON sec.id = s.section_id
JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE p.email = 'estudiante@cermatschool.edu.pe';
```

```sql
-- Ver sus cursos matriculados
SELECT 
  c.name as curso,
  c.code as codigo,
  sce.status
FROM student_course_enrollments sce
JOIN courses c ON c.id = sce.course_id
JOIN students s ON s.id = sce.student_id
JOIN profiles p ON p.id = s.user_id
WHERE p.email = 'estudiante@cermatschool.edu.pe';
```

### Paso 6: Refrescar la aplicación

1. El estudiante debe cerrar sesión
2. Volver a iniciar sesión
3. Ahora debería ver sus cursos, tareas y asistencias

## Script Rápido de Diagnóstico

Ejecuta este script completo para ver el estado actual:

```sql
-- Copia desde aquí hasta el final y ejecuta todo junto
\echo '=== DIAGNÓSTICO DE ESTUDIANTE ==='

-- Perfiles de estudiantes
\echo '\n1. PERFILES DE ESTUDIANTES:'
SELECT id, email, full_name, role, is_active
FROM profiles 
WHERE role = 'student'
ORDER BY email;

-- Estudiantes sin user_id
\echo '\n2. ESTUDIANTES SIN VINCULAR (user_id NULL):'
SELECT 
  s.id,
  s.student_code,
  s.first_name || ' ' || s.last_name as nombre,
  s.user_id,
  sec.section_letter,
  gl.name as grado
FROM students s
LEFT JOIN sections sec ON sec.id = s.section_id
LEFT JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE s.user_id IS NULL;

-- Estudiantes vinculados
\echo '\n3. ESTUDIANTES VINCULADOS CORRECTAMENTE:'
SELECT 
  p.email,
  s.student_code,
  s.first_name || ' ' || s.last_name as nombre,
  sec.section_letter,
  gl.name as grado
FROM profiles p
JOIN students s ON s.user_id = p.id
LEFT JOIN sections sec ON sec.id = s.section_id
LEFT JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE p.role = 'student';

-- Cursos con docentes asignados por sección
\echo '\n4. CURSOS DISPONIBLES POR SECCIÓN:'
SELECT 
  sec.section_letter,
  gl.name as grado,
  c.name as curso,
  c.code,
  t.first_name || ' ' || t.last_name as docente
FROM teacher_course_assignments tca
JOIN sections sec ON sec.id = tca.section_id
JOIN grade_levels gl ON gl.id = sec.grade_level_id
JOIN courses c ON c.id = tca.course_id
JOIN teachers t ON t.id = tca.teacher_id
JOIN academic_years ay ON ay.id = tca.academic_year_id
WHERE ay.is_active = true
ORDER BY sec.section_letter, c.name;
```

## Resumen

El problema es una **desconexión entre el perfil de usuario y el registro de estudiante**. 

**Solución en 3 pasos:**
1. Identificar el `id` del perfil del estudiante (tabla `profiles`)
2. Actualizar el `user_id` en la tabla `students` con ese `id`
3. Ejecutar el script de matriculación para inscribirlo en cursos

Después de esto, el estudiante podrá ver todo su contenido académico.
