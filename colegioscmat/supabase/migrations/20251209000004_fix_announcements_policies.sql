-- =====================================================
-- FIX: Políticas RLS para announcements
-- Problema: Error 403 al insertar comunicados
-- Solución: Simplificar políticas y permitir a todos los roles autorizados
-- =====================================================

-- Eliminar TODAS las políticas (antiguas y nuevas si existen)
DROP POLICY IF EXISTS "Teachers can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can update own announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can delete own draft announcements" ON announcements;
DROP POLICY IF EXISTS "Everyone can read published announcements" ON announcements;
DROP POLICY IF EXISTS "announcements_select_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_update_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_policy" ON announcements;

-- =====================================================
-- NUEVA POLÍTICA: SELECT (Lectura)
-- =====================================================
CREATE POLICY "announcements_select_policy"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    -- Publicados: todos pueden ver
    status = 'publicado' 
    OR 
    -- Propios: siempre puede ver
    created_by = auth.uid() 
    OR 
    -- Admin/Director/Coordinador: ven todo
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- =====================================================
-- NUEVA POLÍTICA: INSERT (Crear)
-- =====================================================
CREATE POLICY "announcements_insert_policy"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    -- El created_by debe ser el usuario actual
    created_by = auth.uid()
    AND
    -- Y debe tener uno de estos roles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin', 'director', 'coordinator')
    )
  );

-- =====================================================
-- NUEVA POLÍTICA: UPDATE (Actualizar)
-- =====================================================
CREATE POLICY "announcements_update_policy"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    -- Propio: puede actualizar sus borradores
    (created_by = auth.uid() AND status IN ('borrador', 'pendiente_aprobacion'))
    OR 
    -- Admin/Director: pueden actualizar cualquiera
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  )
  WITH CHECK (
    -- Propio: puede actualizar sus borradores
    (created_by = auth.uid() AND status IN ('borrador', 'pendiente_aprobacion'))
    OR 
    -- Admin/Director: pueden actualizar cualquiera
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- =====================================================
-- NUEVA POLÍTICA: DELETE (Eliminar)
-- =====================================================
CREATE POLICY "announcements_delete_policy"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    -- Propio: solo puede eliminar borradores
    (created_by = auth.uid() AND status = 'borrador')
    OR 
    -- Admin/Director: pueden eliminar cualquiera
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director')
    )
  );

-- Verificación
SELECT 'Políticas de announcements actualizadas correctamente ✅' as status;
