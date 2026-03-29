# 🚨 MIGRACIONES PENDIENTES - EJECUTAR EN ORDEN

## Estado Actual

Tienes varios errores porque faltan tablas en tu base de datos Supabase. Necesitas ejecutar estas migraciones **EN ORDEN**:

---

## ✅ MIGRACIONES A EJECUTAR

### 1️⃣ **Notificaciones y Auditoría** (SI NO ESTÁ)
**Archivo**: `20251208000004_create_notifications_audit.sql`
- Crea tablas: `notifications`, `audit_logs`
- Crea funciones de auditoría
- **Estado**: ⚠️ Verificar si existe

---

### 2️⃣ **Catálogo Financiero** ⚠️ **FALTA (Error actual)**
**Archivo**: `20251208000003_create_financial_catalog.sql`
- Crea tablas: `fee_concepts`, `financial_plans`, `plan_installments`, `discounts`, `student_discounts`
- **Error actual**: `Could not find the table 'public.fee_concepts'`
- **Acción**: EJECUTAR AHORA

---

### 3️⃣ **Fix Triggers de Notificaciones** ✅ **YA EJECUTADO**
**Archivo**: `20251209000003_fix_evaluation_notification_trigger.sql`
- Corrige triggers para evitar NULL en notificaciones
- **Estado**: ✅ Completado

---

### 4️⃣ **Fix Políticas de Announcements** ✅ **YA EJECUTADO**
**Archivo**: `20251209000004_fix_announcements_policies.sql`
- Corrige políticas RLS de comunicados
- **Estado**: ✅ Completado

---

### 5️⃣ **Fix Foreign Keys de Announcements** ✅ **YA EJECUTADO**
**Archivo**: `20251209000005_fix_announcements_fkeys.sql`
- Corrige FKs de `announcements` a `profiles`
- **Estado**: ✅ Completado

---

## 📋 INSTRUCCIONES

### **Paso 1: Ejecutar Catálogo Financiero (URGENTE)**

1. Abre Supabase Dashboard → SQL Editor
2. Abre el archivo: `supabase/migrations/20251208000003_create_financial_catalog.sql`
3. Copia **TODO** el contenido
4. Pégalo en SQL Editor
5. Clic en **"Run"**
6. ✅ Deberías ver: Queries ejecutadas exitosamente

---

### **Paso 2: Verificar Otras Tablas**

Si después de ejecutar el catálogo financiero siguen apareciendo errores de tablas faltantes, ejecuta también:

#### **Notificaciones** (si no está)
```sql
-- Verificar si existe la tabla
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);
```

Si devuelve `false`, ejecuta: `20251208000004_create_notifications_audit.sql`

---

## 🔍 DIAGNÓSTICO RÁPIDO

Ejecuta esto en Supabase SQL Editor para ver qué tablas faltan:

```sql
-- Verificar tablas financieras
SELECT 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fee_concepts') 
    THEN '✅ fee_concepts' 
    ELSE '❌ fee_concepts FALTA' 
  END as fee_concepts,
  
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_plans') 
    THEN '✅ financial_plans' 
    ELSE '❌ financial_plans FALTA' 
  END as financial_plans,
  
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discounts') 
    THEN '✅ discounts' 
    ELSE '❌ discounts FALTA' 
  END as discounts,
  
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN '✅ notifications' 
    ELSE '❌ notifications FALTA' 
  END as notifications,
  
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN '✅ audit_logs' 
    ELSE '❌ audit_logs FALTA' 
  END as audit_logs;
```

---

## ⚠️ NOTA SOBRE GuardianMessagesPage

El mensaje `"No guardian record found for this user"` es **ESPERADO** cuando:
- Eres admin/director y no tienes registro de apoderado
- Estás probando con un usuario que no es apoderado

**No es un error**, es un comportamiento normal. La página simplemente no carga mensajes porque no hay hijos asociados.

---

## 🎯 RESUMEN

**ACCIÓN INMEDIATA**: Ejecutar `20251208000003_create_financial_catalog.sql` en Supabase para crear las tablas financieras faltantes.

Después de esto, el módulo de finanzas funcionará correctamente. ✅
