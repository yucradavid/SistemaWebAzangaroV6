# Módulo: Entregas de Tareas con Adjuntos 📤

## Estado: ✅ IMPLEMENTADO (Pendiente de migración)

---

## Resumen

Módulo completo de entregas de tareas que permite a estudiantes subir archivos adjuntos (PDF, Word, imágenes) a Supabase Storage y entregar sus trabajos. Los docentes pueden calificar con notas numéricas (0-20) o literales (AD/A/B/C) para primaria.

---

## Componentes Creados

### 1. **Migración SQL** ✅
**Archivo:** `supabase/migrations/20251208000006_add_task_submissions.sql`

**Incluye:**
- Tabla `task_submissions` con campos:
  - `content` (texto de la entrega)
  - `attachment_url`, `attachment_name`, `attachment_size` (archivo adjunto)
  - `status`: draft, submitted, graded, returned
  - `grade` (0-20), `grade_letter` (AD/A/B/C)
  - `feedback` (retroalimentación del docente)
- **Índices** para búsqueda rápida
- **RLS Policies**:
  - Estudiantes: ver/insertar/actualizar propias entregas (antes de calificar)
  - Docentes: ver/calificar todas las entregas
  - Apoderados: ver entregas de sus hijos
- **Storage Policies** para bucket `task-submissions`:
  - Estudiantes: subir a `{student_id}/`
  - Docentes: ver todos los archivos
  - Apoderados: ver archivos de sus hijos
- **Trigger `notify_task_graded()`**: Notifica al estudiante cuando se califica su tarea
- **Vista `assignment_submission_stats`**: Estadísticas de entregas por tarea

### 2. **Modal de Entrega** ✅
**Archivo:** `src/components/tasks/SubmitTaskModal.tsx`

**Características:**
- Formulario con textarea para texto de entrega
- Área de drag & drop para subir archivos (máx 10 MB)
- Validación de tamaño y tipo de archivo
- Preview del archivo seleccionado con opción de eliminar
- Integración con Supabase Storage
- Ruta de archivos: `{student_id}/{assignment_id}/{timestamp}.{ext}`
- Manejo de errores con mensajes claros
- Soporte para actualizar entregas existentes (reemplazar archivo)

### 3. **Página del Estudiante** ✅
**Archivo:** `src/pages/tasks/StudentTasksPage.tsx` (modificado)

**Cambios realizados:**
- Reemplazado sistema de URLs externas por upload directo
- Integración con tabla `task_submissions`
- Modal de entrega con upload de archivos
- Display de archivos adjuntos con botón de descarga
- Badges de estado actualizados (draft, submitted, graded, returned)
- Muestra calificación con letra y número: `AD (18/20)`
- Vista de feedback del docente en modal de detalle
- Botón "Actualizar" para reenviar antes de calificar

---

## Pasos para Activar el Módulo

### **Paso 1: Crear bucket en Supabase Storage**

**Opción A: Desde Supabase Dashboard** (Recomendado)
1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Storage** en el menú lateral
4. Click **Create Bucket**
5. Configurar:
   - **Name:** `task-submissions`
   - **Public:** ❌ NO (privado con RLS)
   - **File Size Limit:** 10 MB
   - **Allowed MIME types:** 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `text/plain`
     - `image/jpeg`
     - `image/png`
6. Click **Create Bucket**

**Opción B: Desde código** (requiere Service Role Key)
```typescript
// Ver src/scripts/create-task-submissions-bucket.ts
// ADVERTENCIA: NO commitear Service Role Key
```

### **Paso 2: Ejecutar migración SQL**

**Opción A: Desde Supabase Dashboard**
1. Ir a **SQL Editor**
2. Click **New Query**
3. Copiar contenido de `supabase/migrations/20251208000006_add_task_submissions.sql`
4. Pegar y ejecutar (Run)
5. Verificar que todas las queries se ejecuten exitosamente

**Opción B: Con Supabase CLI** (si está instalado)
```bash
supabase db push
```

### **Paso 3: Verificar tabla y policies**

En el SQL Editor, ejecutar:

```sql
-- Verificar tabla
SELECT COUNT(*) FROM task_submissions;

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'task_submissions';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE name = 'task-submissions';

-- Verificar storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%submissions%';
```

### **Paso 4: Probar funcionalidad**

1. **Login como estudiante**
2. Ir a **Tareas**
3. Seleccionar una tarea pendiente
4. Click **Entregar**
5. Escribir texto y/o adjuntar archivo (PDF, Word, imagen)
6. Click **Entregar Tarea**
7. Verificar que aparezca en "Entregadas"

8. **Login como docente**
9. Ir a **Tareas** (página de docente - próximo paso)
10. Calificar la entrega con nota y feedback
11. Verificar que el estudiante reciba notificación

---

## Estructura de Datos

### Tabla: `task_submissions`

```sql
task_submissions
├── id (UUID, PK)
├── assignment_id (UUID, FK → assignments)
├── student_id (UUID, FK → students)
├── submission_date (TIMESTAMPTZ)
├── content (TEXT)
├── attachment_url (TEXT) -- URL pública de Supabase Storage
├── attachment_name (TEXT)
├── attachment_size (INTEGER)
├── status (TEXT: draft | submitted | graded | returned)
├── grade (DECIMAL 0-20)
├── grade_letter (TEXT: AD | A | B | C)
├── feedback (TEXT)
├── graded_by (UUID, FK → profiles)
├── graded_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

UNIQUE(assignment_id, student_id)
```

### Storage Structure

```
task-submissions/ (bucket)
└── {student_id}/ (ej: 123e4567-e89b-12d3-a456-426614174000/)
    └── {assignment_id}/
        └── {timestamp}.{ext} (ej: 1702012345678.pdf)
```

---

## Estados de Entrega

| Estado | Descripción | Puede editar estudiante | Puede calificar docente |
|--------|-------------|------------------------|------------------------|
| **draft** | Borrador guardado | ✅ | ❌ |
| **submitted** | Entregada | ❌ | ✅ |
| **graded** | Calificada | ❌ | ✅ (recalificar) |
| **returned** | Devuelta para revisión | ✅ | ❌ |

---

## Próximos Pasos

### **Módulo 2B: Página de Calificación para Docentes** 🔜

Actualizar `TeacherTasksPage.tsx` para:
- Ver lista de entregas por tarea
- Descargar archivos adjuntos
- Ingresar calificación (0-20 o AD/A/B/C)
- Escribir feedback
- Cambiar estado a "graded"
- Botón "Devolver" para cambiar a "returned"

**Estimado:** 2 horas

---

## Dependencias

- ✅ Tabla `assignments` (existente)
- ✅ Tabla `students` (existente)
- ✅ Tabla `profiles` (existente)
- ✅ Tabla `notifications` (existente)
- ✅ Supabase Storage habilitado
- ✅ Componentes UI: Button, Modal, Card, Badge

---

## Testing Checklist

- [ ] Bucket `task-submissions` creado
- [ ] Migración ejecutada sin errores
- [ ] Estudiante puede ver sus tareas
- [ ] Estudiante puede entregar con texto
- [ ] Estudiante puede entregar con archivo
- [ ] Estudiante puede actualizar entrega antes de calificar
- [ ] Estudiante NO puede editar después de calificar
- [ ] Archivo se sube a Storage correctamente
- [ ] Archivo se descarga correctamente
- [ ] Apoderado puede ver entregas de su hijo
- [ ] Docente puede ver todas las entregas (próximo paso)
- [ ] Notificación se crea al calificar

---

## Notas Técnicas

### Límites de Archivos
- **Tamaño máximo:** 10 MB
- **Tipos permitidos:** PDF, Word (.doc/.docx), TXT, JPG, PNG
- **Validación:** Frontend + Storage policies

### Seguridad
- RLS habilitado en tabla y storage
- Estudiantes solo acceden a su carpeta `{student_id}/`
- Docentes acceden a todas las entregas
- URLs públicas solo accesibles con RLS policies

### Performance
- Índices en `assignment_id`, `student_id`, `status`, `graded_at`
- Vista materializada `assignment_submission_stats` para dashboard
- Paginación recomendada para +100 entregas

---

## Autor

**Cermat School v1.0 - Módulo de Entregas de Tareas**  
Fecha: 2025-12-08  
Prioridad: 🔴 **ALTA** (Funcionalidad crítica para demo)

---

## Referencias

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)
