# 🚀 Instrucciones de Deployment - Módulo de Entregas

## ⚠️ IMPORTANTE: Ejecutar en este orden

---

## Paso 1️⃣: Crear Bucket en Supabase Storage

### Opción A: Desde Dashboard (Recomendado) ✅

1. Abre tu navegador y ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **Cermat School**
3. En el menú lateral, click en **Storage**
4. Click en el botón verde **"Create a new bucket"** o **"New Bucket"**
5. Completa el formulario:
   ```
   Name: task-submissions
   Public bucket: ❌ NO (dejar desmarcado)
   File size limit: 10485760 (10 MB)
   Allowed MIME types: (opcional, dejar vacío)
   ```
6. Click **Create bucket**
7. ✅ Verifica que aparezca en la lista de buckets

### Opción B: Desde SQL Editor (Alternativa)

```sql
-- Solo si tienes permisos de Service Role
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('task-submissions', 'task-submissions', false, 10485760);
```

---

## Paso 2️⃣: Ejecutar Migración SQL

### Desde Supabase Dashboard SQL Editor

1. En tu proyecto, ve a **SQL Editor** en el menú lateral
2. Click en **"New query"** o el botón **"+"**
3. Copia TODO el contenido del archivo:
   ```
   📁 cermat/supabase/migrations/20251208000006_add_task_submissions.sql
   ```
4. Pégalo en el editor SQL
5. Click en **"Run"** o presiona `Ctrl + Enter`
6. ⏳ Espera 3-5 segundos mientras se ejecuta
7. ✅ Verifica que aparezca: **"Success. No rows returned"**

### Si hay errores:

**Error: "bucket task-submissions does not exist"**
- ❌ No completaste el Paso 1
- ✅ Vuelve al Paso 1 y crea el bucket

**Error: "relation task_submissions already exists"**
- ✅ Ya ejecutaste la migración antes
- ✅ Puedes continuar al Paso 3

**Error: "permission denied"**
- ❌ No tienes permisos de admin en Supabase
- ✅ Usa el usuario owner del proyecto

---

## Paso 3️⃣: Verificar Instalación

Ejecuta estas queries en SQL Editor para confirmar:

```sql
-- 1. Verificar tabla
SELECT COUNT(*) AS total_submissions FROM task_submissions;
-- Debe retornar: 0 (tabla vacía pero existente)

-- 2. Verificar RLS policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'task_submissions';
-- Debe retornar: 6 policies (students_*, teachers_*, guardians_*)

-- 3. Verificar bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'task-submissions';
-- Debe retornar: 1 fila con public=false y file_size_limit=10485760

-- 4. Verificar storage policies
SELECT policyname, definition 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname ILIKE '%submission%';
-- Debe retornar: 4 policies (students_*, teachers_*, guardians_*)

-- 5. Verificar trigger de notificaciones
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'notify_task_graded_trigger';
-- Debe retornar: 1 fila con tgenabled='O' (enabled)
```

**Resultado esperado:**
```
✅ Tabla task_submissions creada
✅ 6 RLS policies activas
✅ Bucket task-submissions existente
✅ 4 Storage policies activas
✅ Trigger notify_task_graded activo
```

---

## Paso 4️⃣: Testear desde la Aplicación

### Test como Estudiante

1. **Login** con un usuario estudiante
   - Ejemplo: `alumno@cermat.edu.pe` / `password123`

2. **Ir a Tareas**
   - Menú lateral → Tareas

3. **Entregar una tarea**
   - Selecciona una tarea pendiente
   - Click en **"Entregar"**
   - Escribe texto en el área de texto
   - **IMPORTANTE:** Click en el área de adjuntar archivo
   - Selecciona un archivo (PDF, Word, o imagen)
   - Verifica que aparezca el preview del archivo
   - Click en **"Entregar Tarea"**

4. **Verificar entrega**
   - Debe aparecer mensaje: "Tarea entregada exitosamente"
   - El badge debe cambiar a **"Entregada"** (azul)
   - Click en **"Ver detalle"**
   - Debe aparecer tu texto y un botón **"Descargar"** para el archivo
   - Click en Descargar → debe abrir el archivo en nueva pestaña

### Test como Apoderado

1. **Login** con un usuario apoderado
2. **Ir a Tareas** (vista de apoderado)
3. **Ver entregas del hijo**
   - Debe ver la tarea entregada por su hijo
   - Puede ver el texto de la entrega
   - Puede descargar el archivo adjunto

### Verificar en Supabase

```sql
-- Ver entregas creadas
SELECT 
  ts.id,
  s.first_name || ' ' || s.last_name AS student,
  a.title AS assignment,
  ts.status,
  ts.attachment_name,
  ts.attachment_size,
  ts.submission_date
FROM task_submissions ts
JOIN students s ON s.id = ts.student_id
JOIN assignments a ON a.id = ts.assignment_id
ORDER BY ts.submission_date DESC
LIMIT 10;
```

**Verificar archivos en Storage:**

1. Supabase Dashboard → **Storage** → **task-submissions**
2. Debe haber una carpeta con el UUID del estudiante
3. Dentro, una subcarpeta con el UUID de la tarea
4. Dentro, el archivo con nombre: `{timestamp}.{extension}`

---

## 🐛 Troubleshooting

### "Error al enviar la tarea"

**Causa:** Políticas de Storage no aplicadas correctamente

**Solución:**
```sql
-- Re-aplicar Storage policies
DROP POLICY IF EXISTS "students_upload_own_submissions" ON storage.objects;
DROP POLICY IF EXISTS "students_view_own_submissions" ON storage.objects;
DROP POLICY IF EXISTS "teachers_view_all_submissions" ON storage.objects;
DROP POLICY IF EXISTS "guardians_view_children_submissions" ON storage.objects;

-- Ejecutar nuevamente las líneas 218-266 de la migración
```

### "Error: El archivo no debe superar los 10 MB"

**Causa:** Archivo muy grande

**Solución:** Usar un archivo más pequeño o aumentar límite en el bucket

### "No aparece el botón Entregar"

**Causa 1:** El estudiante no tiene `student_id` asociado
```sql
-- Verificar
SELECT s.* FROM students s
JOIN profiles p ON p.user_id = s.user_id
WHERE p.email = 'alumno@cermat.edu.pe';
```

**Causa 2:** La tarea ya fue calificada (status = 'graded')

### "No puedo descargar el archivo"

**Causa:** Policies de Storage no permiten acceso

**Solución:** Verificar que las policies de `storage.objects` estén activas

---

## 📊 Siguiente Paso: Calificación Docente

Una vez confirmado que los estudiantes pueden entregar, continuaremos con:

**Módulo 2B: Sistema de Calificación para Docentes**
- Actualizar `TeacherTasksPage.tsx`
- Ver lista de entregas
- Calificar con nota y feedback
- Cambiar estado a "graded"
- Trigger de notificación automática

---

## ✅ Checklist Final

- [ ] Bucket `task-submissions` creado en Storage
- [ ] Migración SQL ejecutada sin errores
- [ ] 6 RLS policies verificadas en `task_submissions`
- [ ] 4 Storage policies verificadas en `storage.objects`
- [ ] Trigger `notify_task_graded` activo
- [ ] Estudiante puede entregar tarea con texto
- [ ] Estudiante puede entregar tarea con archivo
- [ ] Archivo se sube correctamente a Storage
- [ ] Estudiante puede descargar su archivo
- [ ] Apoderado puede ver entrega de su hijo
- [ ] Badge de estado cambia a "Entregada"
- [ ] Modal de detalle muestra archivo adjunto

---

## 🎉 ¡Listo para Producción!

Una vez completado el checklist, el Módulo 2A está **100% operativo**.

**Progreso general:** 2 de 5 módulos (40%)

**Tiempo invertido:** ~5 horas  
**Tiempo restante:** ~8 horas para completar v1.0

---

## 📞 Soporte

Si encuentras algún error no documentado aquí:

1. Revisa la consola del navegador (F12) para ver el error exacto
2. Verifica las policies RLS en Supabase Dashboard → Authentication → Policies
3. Consulta `docs/TASK_SUBMISSIONS_MODULE.md` para más detalles técnicos

---

**Última actualización:** 2025-12-08  
**Autor:** GitHub Copilot  
**Proyecto:** Cermat School v1.0
