# 🚀 Guía para Ejecutar Migraciones Pendientes

## ❌ Errores Detectados

Tu aplicación muestra estos errores porque faltan tablas en Supabase:

1. **`enrollment_applications` no existe** → Módulo 3 (Matrículas) no funciona
2. **`teacher_course_assignments` no existe** → Módulo 5 (Asignación docentes) no funciona
3. **Campo `user_id` falta en `teachers`** → Módulo de asistencia docente falla

---

## ✅ Solución: Ejecutar Migraciones

### **Paso 1: Abrir Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Clic en **"SQL Editor"** (menú izquierdo)
4. Clic en **"+ New query"**

---

### **Paso 2: Ejecutar Migraciones (en orden)**

Copia y ejecuta CADA migración EN ORDEN:

#### **Migración 1: Notificaciones** ✅
```sql
-- Archivo: 20251208000004_create_notifications_audit.sql
-- Abre el archivo y copia TODO el contenido
-- Pega en SQL Editor y clic en "Run"
```

#### **Migración 2: Gestión de Usuarios** ✅
```sql
-- Archivo: 20251208000005_add_user_management.sql
-- Esta migración agrega el campo user_id a teachers
-- Abre el archivo y copia TODO el contenido
-- Pega en SQL Editor y clic en "Run"
```

#### **Migración 3: Entregas de Tareas** ✅
```sql
-- Archivo: 20251208000006_add_task_submissions.sql
-- Abre el archivo y copia TODO el contenido
-- Pega en SQL Editor y clic en "Run"
```

#### **Migración 4: Solicitudes de Matrícula** ⚠️ IMPORTANTE
```sql
-- Archivo: 20251208000007_add_enrollment_applications.sql
-- Esta migración crea la tabla enrollment_applications
-- Abre el archivo y copia TODO el contenido (336 líneas)
-- Pega en SQL Editor y clic en "Run"
```

#### **Migración 5: Asignación de Cursos a Docentes** ⚠️ IMPORTANTE
```sql
-- Archivo: 20251208000008_add_teacher_course_assignments.sql
-- Esta migración crea la tabla teacher_course_assignments
-- Abre el archivo y copia TODO el contenido (257 líneas)
-- Pega en SQL Editor y clic en "Run"
```

---

### **Paso 3: Verificar que todo funcionó**

Después de ejecutar TODAS las migraciones, ejecuta esta query para verificar:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'enrollment_applications',
    'teacher_course_assignments',
    'task_submissions',
    'notifications'
  )
ORDER BY table_name;
```

**Resultado esperado:** Deberías ver 4 filas con los nombres de las tablas.

---

### **Paso 4: Verificar campo user_id en teachers**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'teachers' 
  AND column_name = 'user_id';
```

**Resultado esperado:** 1 fila mostrando `user_id | uuid`

---

### **Paso 5: Reiniciar la aplicación**

```powershell
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

Los errores deberían desaparecer. ✅

---

## 🔧 Si tienes problemas al ejecutar migraciones

### Error: "relation already exists"
**Solución:** Esa tabla ya existe, omite esa migración.

### Error: "column already exists"
**Solución:** Ese campo ya existe, omite esa parte.

### Error: "syntax error"
**Solución:** Verifica que copiaste TODO el contenido del archivo, incluyendo la primera línea.

### Error: "permission denied"
**Solución:** Asegúrate de estar en el proyecto correcto y tener permisos de admin.

---

## 📋 Checklist de Migraciones

Marca las que ya ejecutaste:

- [ ] Migración 4: `20251208000004_create_notifications_audit.sql`
- [ ] Migración 5: `20251208000005_add_user_management.sql` ⚠️ **CRÍTICA**
- [ ] Migración 6: `20251208000006_add_task_submissions.sql`
- [ ] Migración 7: `20251208000007_add_enrollment_applications.sql` ⚠️ **CRÍTICA**
- [ ] Migración 8: `20251208000008_add_teacher_course_assignments.sql` ⚠️ **CRÍTICA**

---

## 🎯 Resultado Final

Una vez ejecutadas todas las migraciones:

✅ Módulo de Matrículas funcionará  
✅ Módulo de Asignación de Docentes funcionará  
✅ Módulo de Asistencia Docente funcionará  
✅ Módulo de Entregas de Tareas funcionará  
✅ Sistema de Notificaciones funcionará  

---

## 📞 ¿Necesitas ayuda?

Si alguna migración falla:

1. Copia el mensaje de error completo
2. Indica qué archivo estabas ejecutando
3. Envíame el error para ayudarte

---

**¡Importante!** Las migraciones deben ejecutarse EN ORDEN para evitar errores de dependencias.
