# 🚀 INSTRUCCIONES DE DEPLOYMENT - MÓDULO DE MATRÍCULA

## ⚠️ IMPORTANTE: Ejecutar migraciones en orden

Tu error indica que las migraciones SQL no se han ejecutado en Supabase.

### 📝 Migraciones Pendientes

Necesitas ejecutar estas 3 migraciones **EN ORDEN**:

#### 1️⃣ Primera: Tabla de inscripciones + triggers
```bash
supabase/migrations/20251209000000_add_student_course_enrollments.sql
```

#### 2️⃣ Segunda: Sincronización de estudiantes existentes
```bash
supabase/migrations/20251209000001_sync_existing_students.sql
```

#### 3️⃣ Tercera: **CRÍTICA** - Fix de approve_enrollment_application
```bash
supabase/migrations/20251209000002_fix_approve_enrollment.sql
```
Esta corrige el bug de `guardian_id` y crea la función que falta.

---

## 🎯 OPCIÓN A: Ejecutar desde Supabase Dashboard (Recomendado)

### Paso 1: Abre tu proyecto en Supabase
```
https://supabase.com/dashboard/project/scnlwlanqhdqlkqyqpdr
```

### Paso 2: Ve a SQL Editor
- Click en "SQL Editor" en el menú lateral
- Click en "New Query"

### Paso 3: Copia y pega COMPLETO cada archivo SQL

**Migración 1 (270 líneas):**
1. Abre `supabase/migrations/20251209000000_add_student_course_enrollments.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Click en "Run"
5. ✅ Espera mensaje de éxito

**Migración 2 (96 líneas):**
1. Abre `supabase/migrations/20251209000001_sync_existing_students.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Click en "Run"
5. ✅ Espera mensaje de éxito

**Migración 3 (226 líneas) - LA MÁS IMPORTANTE:**
1. Abre `supabase/migrations/20251209000002_fix_approve_enrollment.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Click en "Run"
5. ✅ Espera mensaje de éxito

---

## 🎯 OPCIÓN B: Ejecutar desde Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# 1. Asegúrate de estar linkeado al proyecto
supabase link --project-ref scnlwlanqhdqlkqyqpdr

# 2. Ejecutar migraciones
supabase db push

# 3. Verificar
supabase db reset --linked
```

---

## 🎯 OPCIÓN C: Ejecutar manualmente con psql (Avanzado)

Si tienes acceso directo a PostgreSQL:

```bash
# Obtén tu connection string desde Supabase Dashboard > Settings > Database

# Ejecutar cada migración
psql "postgresql://postgres:[PASSWORD]@db.scnlwlanqhdqlkqyqpdr.supabase.co:5432/postgres" \
  -f supabase/migrations/20251209000000_add_student_course_enrollments.sql

psql "postgresql://postgres:[PASSWORD]@db.scnlwlanqhdqlkqyqpdr.supabase.co:5432/postgres" \
  -f supabase/migrations/20251209000001_sync_existing_students.sql

psql "postgresql://postgres:[PASSWORD]@db.scnlwlanqhdqlkqyqpdr.supabase.co:5432/postgres" \
  -f supabase/migrations/20251209000002_fix_approve_enrollment.sql
```

---

## ✅ Verificación Post-Deployment

Después de ejecutar las migraciones, verifica que todo esté correcto:

### 1. Verificar tabla creada
```sql
SELECT COUNT(*) FROM student_course_enrollments;
```
Debería retornar 0 o más (si hay estudiantes existentes sincronizados).

### 2. Verificar función creada
```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'approve_enrollment_application';
```
Debería retornar 1 fila con la función.

### 3. Verificar triggers
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%enroll%';
```
Debería retornar:
- `trigger_auto_enroll_student_courses` (en students)
- `trigger_sync_student_enrollments` (en teacher_course_assignments)

### 4. Verificar RLS policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'student_course_enrollments';
```
Debería retornar 6 policies.

---

## 🐛 Solución al Error Actual

El error específico que estás viendo:
```
POST .../rpc/approve_enrollment_application 404 (Not Found)
PGRST202: Could not find the function public.approve_enrollment_application
```

**Causa:** La migración `20251209000002_fix_approve_enrollment.sql` NO se ha ejecutado.

**Solución:** Ejecuta la migración 3 siguiendo uno de los métodos arriba.

---

## 📋 Orden de Ejecución (IMPORTANTE)

```mermaid
graph TD
    A[20251209000000] --> B[20251209000001]
    B --> C[20251209000002]
    C --> D[✅ Sistema Funcional]
    
    A -->|Crea tabla + triggers| A1[student_course_enrollments]
    B -->|Sincroniza datos| B1[Backfill existentes]
    C -->|Fix bug crítico| C1[approve_enrollment_application]
```

**NO ejecutes en otro orden** o tendrás errores de dependencias.

---

## 🔥 Troubleshooting

### Error: "relation student_course_enrollments does not exist"
**Solución:** Ejecuta primero la migración 1.

### Error: "function approve_enrollment_application already exists"
**Solución:** Normal, la migración 3 usa `CREATE OR REPLACE`, continuará sin problema.

### Error: "column guardian_id of relation students does not exist"
**Solución:** Esto es esperado, por eso existe la migración 3 que corrige esto.

### Error: "duplicate key value violates unique constraint"
**Solución:** La migración 2 usa `ON CONFLICT DO NOTHING`, no debería pasar. Si pasa, elimina duplicados manualmente.

---

## 📞 Después de Ejecutar

Una vez ejecutadas las 3 migraciones:

1. ✅ Recarga tu aplicación frontend
2. ✅ Prueba aprobar una solicitud de matrícula
3. ✅ Verifica que el estudiante se cree correctamente
4. ✅ Verifica que los cursos se asignen automáticamente
5. ✅ Revisa la tabla `student_course_enrollments` para confirmar inscripciones

---

## 🎯 Resultado Esperado

Después de ejecutar las migraciones:

```
✅ Tabla student_course_enrollments creada
✅ 2 triggers funcionando automáticamente
✅ 6 RLS policies activas
✅ Función approve_enrollment_application disponible
✅ Estudiantes existentes sincronizados con sus cursos
✅ Bug de guardian_id resuelto
✅ Frontend funcionando sin errores 404
```

---

**¿Necesitas ayuda?** Si tienes problemas ejecutando las migraciones, avísame qué método estás usando (Dashboard/CLI/psql) y te guío paso a paso.
