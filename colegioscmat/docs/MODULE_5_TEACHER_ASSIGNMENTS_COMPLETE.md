# Módulo 5: Asignación de Cursos a Docentes - COMPLETADO ✅

**Fecha de implementación:** 8 de diciembre de 2024  
**Estado:** Implementado y listo para testing  
**Tiempo estimado:** 3 horas → **Completado en tiempo**

---

## 📋 Resumen Ejecutivo

Sistema completo de asignación de cursos a docentes con validación automática de carga académica. Permite a administradores asignar cursos por sección a docentes, con control automático del límite de 6 cursos por docente y visualización detallada de la carga de cada profesor.

---

## 🗄️ 1. Esquema de Base de Datos

### Tabla: `teacher_course_assignments`

```sql
CREATE TABLE teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_teacher_section_course_year 
    UNIQUE (teacher_id, section_id, course_id, academic_year_id)
);
```

**Campos clave:**
- `teacher_id`: Docente asignado
- `section_id`: Sección del curso
- `course_id`: Curso asignado
- `academic_year_id`: Año lectivo de la asignación
- `assigned_by`: Usuario que creó la asignación
- `is_active`: Estado de la asignación (para desactivar sin eliminar)
- `notes`: Notas adicionales (ej: "Solo hasta junio")

**Constraint UNIQUE:**
Previene asignaciones duplicadas de la misma combinación docente-sección-curso-año.

### Índices

```sql
CREATE INDEX idx_teacher_assignments_teacher ON teacher_course_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_section ON teacher_course_assignments(section_id);
CREATE INDEX idx_teacher_assignments_course ON teacher_course_assignments(course_id);
CREATE INDEX idx_teacher_assignments_year ON teacher_course_assignments(academic_year_id);
CREATE INDEX idx_teacher_assignments_active ON teacher_course_assignments(is_active);
```

---

## ⚙️ 2. Funciones de Validación

### Función: `validate_teacher_course_limit()`

**Propósito:** Validar que un docente no supere 6 cursos en un año lectivo.

```sql
CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
RETURNS TRIGGER AS $$
DECLARE
  course_count INTEGER;
BEGIN
  -- Contar cursos distintos activos del docente en el año lectivo
  SELECT COUNT(DISTINCT course_id)
  INTO course_count
  FROM teacher_course_assignments
  WHERE teacher_id = NEW.teacher_id
    AND academic_year_id = NEW.academic_year_id
    AND is_active = TRUE
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  -- Si ya tiene 6 cursos, rechazar
  IF course_count >= 6 THEN
    RAISE EXCEPTION 'El docente ya tiene 6 cursos asignados. Máximo permitido alcanzado.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**

```sql
CREATE TRIGGER trigger_validate_teacher_course_limit
  BEFORE INSERT OR UPDATE ON teacher_course_assignments
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION validate_teacher_course_limit();
```

**Comportamiento:**
- Se ejecuta ANTES de INSERT o UPDATE cuando `is_active = TRUE`
- Cuenta cursos DISTINTOS (un mismo curso en múltiples secciones cuenta como 1)
- Lanza excepción si el docente ya tiene 6 cursos
- La excepción es capturada por el frontend y mostrada al usuario

### Función: `get_teacher_course_load()`

**Propósito:** Obtener la carga actual de un docente.

```sql
CREATE OR REPLACE FUNCTION get_teacher_course_load(
  p_teacher_id UUID,
  p_academic_year_id UUID
)
RETURNS TABLE (
  course_name VARCHAR,
  section_name VARCHAR,
  grade_level_name VARCHAR,
  student_count BIGINT,
  assignment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as course_name,
    s.name as section_name,
    gl.name as grade_level_name,
    COUNT(DISTINCT st.id) as student_count,
    COUNT(tca.id) as assignment_count
  FROM teacher_course_assignments tca
  JOIN courses c ON tca.course_id = c.id
  JOIN sections s ON tca.section_id = s.id
  JOIN grade_levels gl ON s.grade_level_id = gl.id
  LEFT JOIN students st ON st.section_id = s.id AND st.is_active = TRUE
  WHERE tca.teacher_id = p_teacher_id
    AND tca.academic_year_id = p_academic_year_id
    AND tca.is_active = TRUE
  GROUP BY c.name, s.name, gl.name
  ORDER BY gl.name, s.name, c.name;
END;
$$ LANGUAGE plpgsql;
```

**Uso desde SQL:**
```sql
SELECT * FROM get_teacher_course_load(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  '987fcdeb-51a2-43b1-b123-987654321000'::UUID
);
```

---

## 📊 3. Vistas de Consulta

### Vista: `teacher_assignments_view`

Vista desnormalizada con toda la información de asignaciones.

```sql
CREATE VIEW teacher_assignments_view AS
SELECT 
  tca.id,
  tca.teacher_id,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
  p.email as teacher_email,
  tca.section_id,
  s.name as section_name,
  tca.course_id,
  c.name as course_name,
  c.code as course_code,
  gl.id as grade_level_id,
  gl.name as grade_level_name,
  tca.academic_year_id,
  ay.name as academic_year_name,
  tca.is_active,
  tca.notes,
  tca.created_at,
  tca.updated_at,
  COUNT(st.id) as student_count
FROM teacher_course_assignments tca
JOIN teachers t ON tca.teacher_id = t.id
JOIN profiles p ON t.profile_id = p.id
JOIN sections s ON tca.section_id = s.id
JOIN grade_levels gl ON s.grade_level_id = gl.id
JOIN courses c ON tca.course_id = c.id
JOIN academic_years ay ON tca.academic_year_id = ay.id
LEFT JOIN students st ON st.section_id = s.id AND st.is_active = TRUE
WHERE tca.is_active = TRUE
GROUP BY 
  tca.id, t.id, p.email, s.id, s.name, 
  c.id, c.name, c.code, gl.id, gl.name, 
  ay.id, ay.name;
```

**Campos retornados:**
- `id`: ID de la asignación
- `teacher_id`, `teacher_name`, `teacher_email`: Info del docente
- `section_id`, `section_name`: Info de la sección
- `course_id`, `course_name`, `course_code`: Info del curso
- `grade_level_id`, `grade_level_name`: Info del grado
- `academic_year_id`, `academic_year_name`: Info del año lectivo
- `is_active`, `notes`: Estado y notas
- `student_count`: Número de estudiantes en la sección

### Vista: `teacher_assignment_stats`

Vista agregada con estadísticas por docente.

```sql
CREATE VIEW teacher_assignment_stats AS
SELECT 
  t.id as teacher_id,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
  p.email as teacher_email,
  ay.id as academic_year_id,
  ay.name as academic_year_name,
  COUNT(DISTINCT tca.course_id) as total_courses,
  COUNT(DISTINCT tca.section_id) as total_sections,
  COUNT(DISTINCT tca.id) as total_assignments,
  SUM(COALESCE(student_counts.student_count, 0)) as total_students,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) as courses_list
FROM teachers t
JOIN profiles p ON t.profile_id = p.id
JOIN teacher_course_assignments tca ON t.id = tca.teacher_id
JOIN courses c ON tca.course_id = c.id
JOIN academic_years ay ON tca.academic_year_id = ay.id
LEFT JOIN (
  SELECT section_id, COUNT(id) as student_count
  FROM students
  WHERE is_active = TRUE
  GROUP BY section_id
) student_counts ON tca.section_id = student_counts.section_id
WHERE tca.is_active = TRUE
GROUP BY t.id, t.first_name, t.last_name, p.email, ay.id, ay.name
ORDER BY teacher_name;
```

**Campos retornados:**
- `teacher_id`, `teacher_name`, `teacher_email`: Info del docente
- `academic_year_id`, `academic_year_name`: Año lectivo
- `total_courses`: Número de cursos DISTINTOS
- `total_sections`: Número de secciones DISTINTAS
- `total_assignments`: Número total de asignaciones (cursos × secciones)
- `total_students`: Suma total de estudiantes en todas las secciones
- `courses_list`: Lista concatenada de nombres de cursos

---

## 🔒 4. Políticas RLS

### Política 1: Visualización general

```sql
CREATE POLICY admin_director_view_all_assignments
  ON teacher_course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'coordinator')
    )
  );
```

**Permite:** Admin, directores y coordinadores pueden ver TODAS las asignaciones.

### Política 2: Docentes ven propias asignaciones

```sql
CREATE POLICY teachers_view_own_assignments
  ON teacher_course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = teacher_course_assignments.teacher_id
        AND teachers.profile_id = auth.uid()
    )
  );
```

**Permite:** Docentes pueden ver SOLO sus propias asignaciones.

### Política 3: Creación de asignaciones

```sql
CREATE POLICY admin_create_assignments
  ON teacher_course_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'coordinator')
    )
  );
```

**Permite:** Admin, directores y coordinadores pueden crear asignaciones.

### Política 4: Actualización de asignaciones

```sql
CREATE POLICY admin_update_assignments
  ON teacher_course_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'coordinator')
    )
  );
```

**Permite:** Admin, directores y coordinadores pueden actualizar asignaciones.

### Política 5: Eliminación de asignaciones

```sql
CREATE POLICY admin_delete_assignments
  ON teacher_course_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director')
    )
  );
```

**Permite:** SOLO admin y directores pueden eliminar asignaciones (coordinadores NO).

---

## 🖥️ 5. Componente Principal

### `TeacherAssignmentsPage.tsx`

**Ubicación:** `src/pages/settings/TeacherAssignmentsPage.tsx`  
**Líneas:** 540

#### Estructura del componente

```typescript
interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_assignments: number; // Calculado en cliente
}

interface Assignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  section_id: string;
  section_name: string;
  grade_level_name: string;
  course_id: string;
  course_name: string;
  student_count: number;
}
```

#### Funciones principales

##### `loadTeachers()`

Carga docentes activos y cuenta sus asignaciones:

```typescript
async function loadTeachers(yearId: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`id, first_name, last_name, profiles!inner(email)`)
    .eq('is_active', true)
    .order('last_name');

  const teachersWithCounts = await Promise.all(
    (data || []).map(async (teacher: any) => {
      const { count } = await supabase
        .from('teacher_course_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacher.id)
        .eq('academic_year_id', yearId)
        .eq('is_active', true);

      return {
        id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.profiles.email,
        current_assignments: count || 0,
      };
    })
  );
}
```

##### `loadAssignments()`

Carga asignaciones desde la vista:

```typescript
async function loadAssignments(yearId: string) {
  const { data, error } = await supabase
    .from('teacher_assignments_view')
    .select('*')
    .eq('academic_year_id', yearId)
    .order('teacher_name');

  // Formatear datos...
}
```

##### `handleCreateAssignment()`

Valida y crea nueva asignación:

```typescript
async function handleCreateAssignment() {
  // 1. Validar campos requeridos
  if (!selectedTeacher || !selectedSection || !selectedCourse) {
    setError('Debes seleccionar docente, sección y curso');
    return;
  }

  // 2. Validar límite de 6 cursos (frontend)
  const teacher = teachers.find(t => t.id === selectedTeacher);
  if (teacher && teacher.current_assignments >= 6) {
    setError(`El docente ya tiene ${teacher.current_assignments} cursos asignados`);
    return;
  }

  // 3. Validar duplicados (frontend)
  const exists = assignments.some(
    a => a.teacher_id === selectedTeacher && 
         a.section_id === selectedSection && 
         a.course_id === selectedCourse
  );

  if (exists) {
    setError('Esta asignación ya existe');
    return;
  }

  // 4. Insertar en base de datos
  const { error: insertError } = await supabase
    .from('teacher_course_assignments')
    .insert({
      teacher_id: selectedTeacher,
      section_id: selectedSection,
      course_id: selectedCourse,
      academic_year_id: academicYearId,
      assigned_by: user?.id,
      is_active: true,
    });

  // 5. Manejar errores (trigger de validación)
  if (insertError) throw insertError;

  // 6. Recargar datos y limpiar formulario
}
```

##### `handleDeleteAssignment()`

Elimina asignación con confirmación:

```typescript
async function handleDeleteAssignment(assignmentId: string) {
  if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

  const { error: deleteError } = await supabase
    .from('teacher_course_assignments')
    .delete()
    .eq('id', assignmentId);

  if (deleteError) throw deleteError;

  // Recargar datos
  await loadTeachers(academicYearId);
  await loadAssignments(academicYearId);
}
```

#### Interfaz de usuario

##### Formulario de creación

```tsx
<Card className="p-6">
  <h2>Nueva Asignación</h2>

  {/* Alerta de error */}
  {error && (
    <div className="bg-red-50 border-2 border-red-200">
      <AlertCircle /> {error}
    </div>
  )}

  {/* Dropdowns */}
  <div className="grid md:grid-cols-3 gap-4">
    <Select label="Docente" options={teachers} />
    <Select label="Sección" options={sections} />
    <Select label="Curso" options={courses} />
  </div>

  {/* Indicador de carga del docente */}
  {selectedTeacherData && (
    <div className="bg-blue-50">
      {teacher.first_name} tiene {teacher.current_assignments} cursos.
      Puede agregar {6 - teacher.current_assignments} más.
    </div>
  )}

  <Button disabled={!canAddMore}>Crear Asignación</Button>
</Card>
```

##### Lista de asignaciones

Agrupadas por docente con tarjetas:

```tsx
{Object.entries(assignmentsByTeacher).map(([teacherId, data]) => (
  <Card key={teacherId}>
    {/* Header con nombre y badge de carga */}
    <div className="flex justify-between">
      <div>
        <h3>{data.teacher_name}</h3>
        <p>{teacher.email}</p>
      </div>
      <Badge variant={isAtLimit ? 'error' : 'success'}>
        {assignmentCount}/6 cursos
      </Badge>
    </div>

    {/* Grid de asignaciones */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.assignments.map(assignment => (
        <div key={assignment.id} className="p-4 bg-gray-50">
          <p className="font-semibold">{assignment.course_name}</p>
          <p className="text-sm">{assignment.grade_level_name} - {assignment.section_name}</p>
          <p className="text-xs">{assignment.student_count} estudiantes</p>
          <button onClick={() => handleDeleteAssignment(assignment.id)}>
            <Trash2 />
          </button>
        </div>
      ))}
    </div>
  </Card>
))}
```

##### Resumen estadístico

```tsx
<Card className="bg-blue-50">
  <h3>Resumen del Sistema</h3>
  <div className="grid md:grid-cols-4 gap-4">
    <div>
      <p>Total docentes</p>
      <p className="text-2xl">{teachers.length}</p>
    </div>
    <div>
      <p>Total asignaciones</p>
      <p className="text-2xl">{assignments.length}</p>
    </div>
    <div>
      <p>Docentes con asignaciones</p>
      <p className="text-2xl">{Object.keys(assignmentsByTeacher).length}</p>
    </div>
    <div>
      <p>Promedio cursos/docente</p>
      <p className="text-2xl">
        {(assignments.length / Object.keys(assignmentsByTeacher).length).toFixed(1)}
      </p>
    </div>
  </div>
</Card>
```

---

## 🔗 6. Integración con el Sistema

### Actualización de rutas

**Archivo:** `src/routes/AppRoutes.tsx`

```tsx
import { TeacherAssignmentsPage } from '../pages/settings/TeacherAssignmentsPage';

// ...

<Route
  path="/settings/teacher-assignments"
  element={
    <ProtectedRoute allowedRoles={['admin', 'director', 'coordinator']}>
      <AppLayout>
        <TeacherAssignmentsPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

### Actualización del Sidebar

**Archivo:** `src/components/layout/Sidebar.tsx`

```tsx
{
  path: '/settings',
  label: 'Configuración',
  icon: <Settings />,
  roles: ['admin', 'director'],
  children: [
    { path: '/settings/users', label: 'Usuarios', roles: ['admin', 'director'] },
    { path: '/settings/academic-years', label: 'Años lectivos', roles: ['admin', 'director'] },
    { path: '/settings/periods', label: 'Periodos', roles: ['admin', 'director'] },
    { path: '/settings/grades', label: 'Grados', roles: ['admin', 'director'] },
    { path: '/settings/sections', label: 'Secciones', roles: ['admin', 'director'] },
    { path: '/settings/courses', label: 'Cursos', roles: ['admin', 'director'] },
    { path: '/settings/competencies', label: 'Competencias', roles: ['admin', 'director'] },
    { 
      path: '/settings/teacher-assignments', 
      label: 'Asignar cursos a docentes', 
      roles: ['admin', 'director', 'coordinator'] 
    },
  ],
}
```

---

## ✅ 7. Testing y Verificación

### Checklist de Testing

#### A. Testing de Base de Datos

- [ ] **Ejecutar migración en Supabase**
  ```sql
  -- Desde Supabase SQL Editor
  -- Copiar y ejecutar: 20251208000008_add_teacher_course_assignments.sql
  ```

- [ ] **Verificar tabla creada**
  ```sql
  SELECT * FROM teacher_course_assignments LIMIT 1;
  ```

- [ ] **Verificar vistas**
  ```sql
  SELECT * FROM teacher_assignments_view LIMIT 5;
  SELECT * FROM teacher_assignment_stats;
  ```

- [ ] **Probar función de validación**
  ```sql
  -- Intentar insertar 7 cursos al mismo docente
  INSERT INTO teacher_course_assignments (teacher_id, section_id, course_id, academic_year_id)
  VALUES 
    ('teacher-uuid', 'section1-uuid', 'course1-uuid', 'year-uuid'),
    ('teacher-uuid', 'section1-uuid', 'course2-uuid', 'year-uuid'),
    -- ... hasta 7 cursos
  ;
  -- Debería fallar en el 7mo con el mensaje de error
  ```

- [ ] **Probar función get_teacher_course_load()**
  ```sql
  SELECT * FROM get_teacher_course_load(
    'teacher-uuid'::UUID,
    'year-uuid'::UUID
  );
  ```

#### B. Testing de Frontend

- [ ] **Acceso a la página**
  - Navegar a `/settings/teacher-assignments`
  - Verificar que solo admin/director/coordinator pueden acceder
  - Verificar que teacher/student/guardian reciben 403

- [ ] **Carga de datos inicial**
  - Verificar que se cargan los docentes con contadores
  - Verificar que se cargan las secciones agrupadas por grado
  - Verificar que se cargan los cursos activos
  - Verificar que se cargan las asignaciones existentes

- [ ] **Crear asignación válida**
  - Seleccionar docente con <6 cursos
  - Seleccionar sección
  - Seleccionar curso
  - Verificar mensaje de "Puede agregar X más"
  - Clic en "Crear Asignación"
  - Verificar que aparece en la lista
  - Verificar que el contador del docente aumenta

- [ ] **Validación de límite de 6 cursos**
  - Seleccionar docente con 6 cursos
  - Intentar asignar un 7mo curso
  - Verificar mensaje de error: "El docente ya tiene 6 cursos asignados"
  - Verificar que botón de crear está deshabilitado

- [ ] **Validación de duplicados**
  - Intentar crear asignación que ya existe
  - Verificar mensaje: "Esta asignación ya existe"

- [ ] **Eliminar asignación**
  - Clic en botón de eliminar (Trash2)
  - Verificar modal de confirmación
  - Confirmar eliminación
  - Verificar que desaparece de la lista
  - Verificar que contador del docente disminuye

- [ ] **Resumen estadístico**
  - Verificar "Total docentes" correcto
  - Verificar "Total asignaciones" correcto
  - Verificar "Docentes con asignaciones" correcto
  - Verificar "Promedio cursos/docente" calculado correctamente

- [ ] **Badges de carga**
  - Docente con 0-3 cursos: Badge verde
  - Docente con 4-5 cursos: Badge amarillo
  - Docente con 6 cursos: Badge rojo

#### C. Testing de Errores

- [ ] **Error de trigger en backend**
  - Intentar crear 7ma asignación directamente en Supabase
  - Verificar que el trigger rechaza con mensaje claro
  - Verificar que el frontend captura el error

- [ ] **Error de RLS**
  - Iniciar sesión como teacher
  - Intentar acceder a `/settings/teacher-assignments` vía URL
  - Verificar redirección o error 403

- [ ] **Error de conexión**
  - Desconectar internet
  - Intentar crear asignación
  - Verificar mensaje de error de red

#### D. Testing de Edge Cases

- [ ] **Docente sin asignaciones**
  - Verificar que no aparece en la lista de "Asignaciones Actuales"
  - Verificar que aparece en dropdown con "(0/6 cursos)"

- [ ] **Sección sin estudiantes**
  - Crear asignación a sección vacía
  - Verificar que muestra "0 estudiantes"

- [ ] **Año lectivo sin asignaciones**
  - Cambiar año lectivo activo
  - Verificar que la página queda vacía
  - Crear asignación
  - Verificar que aparece correctamente

- [ ] **Docente con múltiples secciones del mismo curso**
  - Asignar "Matemáticas" en "3A" y "3B" al mismo docente
  - Verificar que cuenta como 1 solo curso (no 2)
  - Verificar que ambas aparecen como tarjetas separadas

#### E. Testing de UX

- [ ] **Responsive design**
  - Probar en móvil (320px): Grid 1 columna
  - Probar en tablet (768px): Grid 2 columnas
  - Probar en desktop (1024px): Grid 3 columnas

- [ ] **Loading states**
  - Verificar spinner al cargar página
  - Verificar texto "Creando..." al enviar formulario

- [ ] **Estados vacíos**
  - Verificar mensaje "No hay asignaciones creadas aún" si está vacío
  - Verificar icono y texto centrado

---

## 📝 8. Casos de Uso

### Caso 1: Asignar cursos al inicio del año lectivo

**Actor:** Coordinador académico  
**Precondiciones:** Año lectivo activo, docentes, secciones y cursos creados

**Flujo:**
1. Coordinador navega a Configuración → Asignar cursos a docentes
2. Selecciona docente "María González"
3. Selecciona sección "3° Primaria - A"
4. Selecciona curso "Matemáticas"
5. Sistema muestra: "María González tiene 0 cursos. Puede agregar 6 más."
6. Coordinador crea asignación
7. Sistema confirma creación
8. Coordinador repite para todos los cursos de María (hasta 6)
9. Sistema bloquea al llegar a 6 y muestra: "Ha alcanzado el límite máximo de 6 cursos"

### Caso 2: Docente revisa sus asignaciones

**Actor:** Docente "Pedro Ramírez"  
**Precondiciones:** Pedro tiene 4 cursos asignados

**Flujo:**
1. Pedro inicia sesión
2. Pedro navega a su dashboard
3. Sistema lista sus 4 cursos asignados (filtrado por RLS)
4. Pedro ve: Matemáticas 3A, Matemáticas 3B, Física 4A, Química 4B
5. Pedro puede filtrar sus vistas por estos cursos/secciones

### Caso 3: Reasignar curso por licencia

**Actor:** Director  
**Precondiciones:** Docente A tiene licencia médica, docente B disponible

**Flujo:**
1. Director navega a asignaciones
2. Busca asignaciones del docente A
3. Elimina asignación "Matemáticas 3A" de docente A
4. Asigna "Matemáticas 3A" a docente B
5. Sistema valida que docente B no supere 6 cursos
6. Sistema confirma reasignación
7. Docente B puede ver "Matemáticas 3A" en su dashboard

### Caso 4: Prevenir sobrecarga

**Actor:** Director  
**Precondiciones:** Docente tiene 5 cursos asignados

**Flujo:**
1. Director intenta asignar 2 cursos más al mismo docente
2. Al 1er curso, sistema permite (5 → 6)
3. Al 2do curso, sistema muestra error frontend: "ya tiene 6 cursos"
4. Si el director intenta forzar vía SQL, trigger rechaza con error
5. Director debe asignar el 7mo curso a otro docente

---

## 🚀 9. Despliegue

### Pasos de despliegue

1. **Ejecutar migración en Supabase**
   - Ir a Supabase Dashboard → SQL Editor
   - Copiar contenido de `20251208000008_add_teacher_course_assignments.sql`
   - Ejecutar
   - Verificar mensaje de éxito

2. **Verificar estructura creada**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'teacher_course_assignments';
   
   SELECT viewname FROM pg_views 
   WHERE viewname IN ('teacher_assignments_view', 'teacher_assignment_stats');
   ```

3. **Probar funciones**
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('validate_teacher_course_limit', 'get_teacher_course_load');
   ```

4. **Verificar RLS**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'teacher_course_assignments';
   ```

5. **Regenerar tipos TypeScript** (solo si es necesario)
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
   ```

6. **Desplegar frontend**
   - Código ya integrado en `main`
   - Hacer push a repositorio
   - Vercel/Netlify rebuildeará automáticamente

---

## 📚 10. Documentación para Usuarios

### Manual de Usuario: Asignación de Cursos

#### ¿Qué es este módulo?

Permite a administradores y directores asignar cursos específicos a docentes por sección. Esto asegura que:
- Cada docente sabe exactamente qué cursos impartir
- No se sobrecarga a ningún docente (máximo 6 cursos)
- Los docentes solo ven información de sus secciones asignadas

#### ¿Cómo asignar un curso?

1. Ve a **Configuración → Asignar cursos a docentes**
2. En "Nueva Asignación":
   - **Docente:** Selecciona el profesor
   - **Sección:** Selecciona el grado y sección
   - **Curso:** Selecciona la materia
3. Verás un mensaje indicando cuántos cursos más puede recibir el docente
4. Clic en **"Crear Asignación"**

#### ¿Qué significa el límite de 6 cursos?

Para proteger la carga de trabajo de los docentes, el sistema limita a 6 CURSOS distintos por profesor. Ejemplo:

- ✅ **Válido:** Matemáticas en 3A, 3B, 3C + Física en 4A, 4B, 4C = 2 cursos (6 asignaciones)
- ❌ **Inválido:** Matemáticas, Física, Química, Biología, Historia, Geografía, Inglés = 7 cursos

#### ¿Cómo eliminar una asignación?

1. Busca el docente en "Asignaciones Actuales"
2. Encuentra la tarjeta del curso específico
3. Clic en el ícono de **papelera (🗑️)**
4. Confirma la eliminación

#### Badges de carga

- 🟢 **Verde (0-3 cursos):** Carga baja, puede recibir más
- 🟡 **Amarillo (4-5 cursos):** Carga alta, casi al límite
- 🔴 **Rojo (6 cursos):** Límite alcanzado, no puede recibir más

---

## 🔧 11. Mantenimiento y Mejoras Futuras

### Mejoras posibles (fuera del scope actual)

1. **Asignación masiva**
   - UI para asignar un curso a múltiples docentes/secciones a la vez
   - Importar asignaciones desde CSV

2. **Historial de cambios**
   - Auditoría de quién creó/modificó/eliminó cada asignación
   - Tabla `teacher_assignment_history` con triggers

3. **Validaciones adicionales**
   - Prevenir choques de horarios (requiere módulo de horarios)
   - Validar que el docente esté calificado para el curso (tabla de especialidades)

4. **Dashboard para docentes**
   - Vista de horario semanal
   - Lista de estudiantes por sección
   - Carga académica visual (gráfico)

5. **Notificaciones**
   - Email al docente cuando se le asigna un curso
   - Alerta al admin cuando un docente llega a 6 cursos

6. **Reportes**
   - Reporte de carga de trabajo por docente
   - Reporte de cursos sin asignar
   - Exportar a Excel

---

## ✅ Estado Final

**Módulo 5: COMPLETADO** ✅

### Archivos creados

1. ✅ `supabase/migrations/20251208000008_add_teacher_course_assignments.sql` (257 líneas)
2. ✅ `src/pages/settings/TeacherAssignmentsPage.tsx` (540 líneas)
3. ✅ `docs/MODULE_5_TEACHER_ASSIGNMENTS_COMPLETE.md` (este archivo)

### Archivos modificados

1. ✅ `src/routes/AppRoutes.tsx` (agregada ruta `/settings/teacher-assignments`)
2. ✅ `src/components/layout/Sidebar.tsx` (agregado item de menú)

### Funcionalidades implementadas

- ✅ Tabla `teacher_course_assignments` con constraint UNIQUE
- ✅ 5 índices para rendimiento
- ✅ Trigger de validación de límite de 6 cursos
- ✅ Función `get_teacher_course_load()` para consultar carga
- ✅ Vista `teacher_assignments_view` con JOINs completos
- ✅ Vista `teacher_assignment_stats` con agregaciones
- ✅ 5 políticas RLS (admin, coordinador, docente)
- ✅ Componente con formulario de creación
- ✅ Lista de asignaciones agrupadas por docente
- ✅ Validación frontend de límite de 6 cursos
- ✅ Validación frontend de duplicados
- ✅ Badges de carga con colores (verde/amarillo/rojo)
- ✅ Resumen estadístico del sistema
- ✅ Funcionalidad de eliminación con confirmación
- ✅ Integración con rutas protegidas
- ✅ Integración con Sidebar

### Próximo paso

**Testing completo** → Ejecutar migración y probar todos los casos de uso listados en sección 7.

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que la migración se ejecutó correctamente
2. Verifica que los datos base existen (teachers, sections, courses, academic_years)
3. Verifica permisos de usuario (debe ser admin, director o coordinator)
4. Revisa consola del navegador para errores de Supabase
5. Revisa logs de Supabase para errores de trigger/RLS

---

**Documento generado:** 8 de diciembre de 2024  
**Versión:** 1.0  
**Módulo:** 5 de 6 (último módulo crítico)  
**Estado:** ✅ COMPLETADO
