# 🔧 Instrucciones para Backend: Corrección de Horarios de Estudiantes

**Fecha:** 22 de Diciembre de 2024  
**Prioridad:** Alta  
**Área afectada:** Módulo de Matrículas y Horarios

---

## 📋 Problema Detectado

Cuando el administrador aprueba una solicitud de matrícula:
1. ✅ Se crea el registro del estudiante en la tabla `students` con `section_id` asignado
2. ✅ Se crea la cuenta de acceso (Supabase Auth)
3. ❌ **FALLA:** No se puede vincular el `user_id` al registro del estudiante

**Resultado:** El estudiante puede iniciar sesión, pero al entrar al módulo de horarios ve el mensaje:
> "No estás asignado a una sección"

---

## 🔍 Causa Raíz

La tabla `students` tiene **Row Level Security (RLS) activado**, pero **no existe ninguna política que permita a los administradores hacer UPDATE**.

Cuando el frontend ejecuta:
```javascript
supabase.from('students').update({ user_id: authData.user.id }).eq('id', result.student_id)
```

La operación falla silenciosamente porque RLS la bloquea.

---

## ✅ Solución Requerida

Ejecutar el siguiente SQL en el proyecto de Supabase:

### Opción 1: Dashboard de Supabase
1. Ir a **SQL Editor** en el Dashboard
2. Crear nueva consulta
3. Pegar y ejecutar el siguiente código:

```sql
-- =====================================================
-- CORRECCIÓN: Políticas RLS para tabla students
-- =====================================================
-- Sin estas políticas, los admins no pueden:
-- - Vincular user_id después de crear cuentas
-- - Cambiar secciones de estudiantes
-- - Actualizar datos de estudiantes
-- =====================================================

-- Política para que admins y directores puedan ACTUALIZAR estudiantes
CREATE POLICY "Admin can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- Política para que admins y directores puedan INSERTAR estudiantes
CREATE POLICY "Admin can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );
```

### Opción 2: Supabase CLI
Si usas la CLI, el archivo de migración ya está creado en:
```
supabase/migrations/20251222000003_add_students_update_policy.sql
```

Ejecutar:
```bash
supabase db push
```

---

## 🧪 Verificación Post-Aplicación

Después de aplicar el SQL, verificar que funciona:

1. Aprobar una nueva solicitud de matrícula
2. Iniciar sesión con la cuenta del estudiante creado
3. Ir al módulo de **Mi Horario**
4. Debe mostrar el horario de la sección asignada (si tiene clases programadas)

---

## 📌 Notas Adicionales

Si hay estudiantes ya aprobados que no pueden ver su horario, es posible que su `user_id` no esté vinculado. Para verificar:

```sql
-- Ver estudiantes sin user_id vinculado
SELECT id, student_code, first_name, last_name, section_id, user_id
FROM students
WHERE user_id IS NULL AND status = 'active';
```

Para vincularlos manualmente (si conoces el user_id del auth.users):
```sql
UPDATE students 
SET user_id = 'UUID_DEL_USUARIO_AUTH' 
WHERE id = 'UUID_DEL_ESTUDIANTE';
```

---

**Contacto:** Si hay dudas, coordinar con el equipo de frontend.
