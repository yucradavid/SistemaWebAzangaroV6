# 🚀 Guía de Despliegue - Módulo 5: Asignación de Cursos a Docentes

## ✅ Paso 1: Ejecutar Migración en Supabase

### Opción A: Desde Supabase Dashboard (Recomendado)

1. **Ir a Supabase Dashboard**
   - Abre tu navegador
   - Ve a: https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

2. **Seleccionar tu proyecto**
   - Clic en tu proyecto "cermat" o como lo hayas nombrado

3. **Abrir SQL Editor**
   - En el menú lateral izquierdo, clic en **"SQL Editor"**
   - Clic en botón **"+ New query"**

4. **Copiar y pegar la migración**
   - Abre el archivo: `supabase/migrations/20251208000008_add_teacher_course_assignments.sql`
   - Copia TODO el contenido (257 líneas)
   - Pega en el SQL Editor de Supabase

5. **Ejecutar la migración**
   - Clic en botón **"Run"** (o presiona Ctrl+Enter / Cmd+Enter)
   - Espera a que termine (debería tomar 2-5 segundos)
   - Verifica mensaje de éxito: ✅ "Success. No rows returned"

6. **Verificar que se creó correctamente**
   - En el mismo SQL Editor, ejecuta esta query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'teacher_course_assignments';
   ```
   - Deberías ver 1 fila con el nombre de la tabla

### Opción B: Desde Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

```powershell
# Navegar al proyecto
cd C:\Users\User\Downloads\cermat

# Ejecutar migración
npx supabase migration up
```

---

## ✅ Paso 2: Verificar la Estructura

Ejecuta estas queries en SQL Editor para verificar:

### Verificar tabla
```sql
SELECT * FROM teacher_course_assignments LIMIT 1;
```

### Verificar vistas
```sql
SELECT * FROM teacher_assignments_view LIMIT 1;
SELECT * FROM teacher_assignment_stats LIMIT 1;
```

### Verificar funciones
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('validate_teacher_course_limit', 'get_teacher_course_load');
```

### Verificar políticas RLS
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'teacher_course_assignments';
```

**Resultado esperado:**
- `admin_director_view_all_assignments`
- `teachers_view_own_assignments`
- `admin_create_assignments`
- `admin_update_assignments`
- `admin_delete_assignments`

---

## ✅ Paso 3: Probar el Sistema

1. **Iniciar la aplicación**
   ```powershell
   npm run dev
   ```

2. **Iniciar sesión como admin/director**
   - Usuario con rol `admin`, `director` o `coordinator`

3. **Navegar al módulo**
   - Ve a: **Configuración** → **Asignar cursos a docentes**
   - URL: `http://localhost:5173/settings/teacher-assignments`

4. **Crear una asignación de prueba**
   - Selecciona un docente
   - Selecciona una sección
   - Selecciona un curso
   - Clic en "Crear Asignación"
   - ✅ Debería aparecer en la lista

5. **Probar límite de 6 cursos**
   - Crea 5 asignaciones más al mismo docente (diferentes cursos)
   - Al intentar crear la 7ma, debería mostrar error:
     > "El docente ya tiene 6 cursos asignados. Máximo permitido: 6"

6. **Probar eliminación**
   - Clic en ícono de papelera 🗑️
   - Confirmar eliminación
   - ✅ Debería desaparecer de la lista

---

## ✅ Paso 4: Datos de Prueba (Opcional)

Si necesitas datos de ejemplo para probar, ejecuta esto en SQL Editor:

```sql
-- Asignar "Matemática" a un docente en la sección "3° Primaria - A"
INSERT INTO teacher_course_assignments (
  teacher_id, 
  section_id, 
  course_id, 
  academic_year_id,
  assigned_by
)
VALUES (
  (SELECT id FROM teachers WHERE is_active = true LIMIT 1),
  (SELECT id FROM sections LIMIT 1),
  (SELECT id FROM courses WHERE is_active = true LIMIT 1),
  (SELECT id FROM academic_years WHERE is_active = true LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);
```

---

## 🔧 Paso 5: Regenerar Tipos TypeScript (Opcional)

Si ves errores de TypeScript o autocompletado no funciona:

```powershell
# Reemplaza YOUR_PROJECT_REF con tu project ref de Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/database.types.ts
```

**¿Dónde encontrar tu Project Ref?**
- Supabase Dashboard → Settings → General → Reference ID

---

## 🎯 Checklist de Verificación

Antes de dar por completado el despliegue:

- [ ] Migración ejecutada sin errores
- [ ] Tabla `teacher_course_assignments` existe
- [ ] Vistas `teacher_assignments_view` y `teacher_assignment_stats` existen
- [ ] Funciones creadas (validate, get_teacher_course_load)
- [ ] 5 políticas RLS activas
- [ ] Página accesible en `/settings/teacher-assignments`
- [ ] Formulario de creación funciona
- [ ] Validación de 6 cursos funciona
- [ ] Eliminación funciona
- [ ] Badges de colores se muestran correctamente
- [ ] Resumen estadístico muestra datos correctos

---

## ❌ Solución de Problemas

### Error: "relation teacher_course_assignments does not exist"
**Causa:** La migración no se ejecutó correctamente  
**Solución:** Vuelve a ejecutar la migración en SQL Editor

### Error: "violates row-level security policy"
**Causa:** Tu usuario no tiene rol admin/director/coordinator  
**Solución:** 
```sql
-- Actualizar tu usuario a admin
UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@example.com';
```

### Error: "function validate_teacher_course_limit() does not exist"
**Causa:** La función no se creó  
**Solución:** Ejecuta solo la parte de CREATE FUNCTION de la migración

### Página no carga / Error 404
**Causa:** Rutas no actualizadas  
**Solución:** Reinicia el servidor de desarrollo (Ctrl+C y `npm run dev`)

### Validación de 6 cursos no funciona
**Causa:** Trigger no está activo  
**Solución:** Verifica que el trigger existe:
```sql
SELECT tgname FROM pg_trigger 
WHERE tgname = 'trigger_validate_teacher_course_limit';
```

---

## 📞 Soporte Adicional

Si encuentras problemas:

1. Revisa la consola del navegador (F12) para errores JavaScript
2. Revisa los logs de Supabase (Dashboard → Logs)
3. Verifica que tienes datos base:
   - `SELECT COUNT(*) FROM teachers WHERE is_active = true;`
   - `SELECT COUNT(*) FROM sections;`
   - `SELECT COUNT(*) FROM courses WHERE is_active = true;`
   - `SELECT COUNT(*) FROM academic_years WHERE is_active = true;`

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, el **Módulo 5** estará 100% operativo.

**Sistema completo: 6/6 módulos** ✅

- ✅ Módulo 1: Gestión de Usuarios
- ✅ Módulo 2: Entregas y Calificación de Tareas
- ✅ Módulo 3: Solicitudes de Matrícula
- ✅ Módulo 4: Gráficos Financieros
- ✅ Módulo 5: Asignación de Cursos a Docentes

**Tu sistema está listo para la demo con el director** 🚀
