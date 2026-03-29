-- =====================================================
-- FIX: Foreign keys de announcements
-- Problema: No se encuentra relación entre announcements y profiles
-- Solución: Cambiar FK de auth.users a profiles
-- =====================================================

-- 1. Eliminar las foreign keys antiguas
ALTER TABLE announcements 
  DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE announcements 
  DROP CONSTRAINT IF EXISTS announcements_approved_by_fkey;

-- 2. Agregar las nuevas foreign keys apuntando a profiles
ALTER TABLE announcements
  ADD CONSTRAINT announcements_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE announcements
  ADD CONSTRAINT announcements_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Verificación
SELECT 'Foreign keys de announcements actualizadas correctamente ✅' as status;
