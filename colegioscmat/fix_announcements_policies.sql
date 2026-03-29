-- =====================================================
-- FIX URGENTE: Comunicados no se pueden crear (Error 403)
-- Ejecutar esto AHORA en Supabase SQL Editor
-- =====================================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Teachers can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can update own announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can delete own draft announcements" ON announcements;
DROP POLICY IF EXISTS "Everyone can read published announcements" ON announcements;

-- NUEVA POLÍTICA: SELECT (Lectura)
CREATE POLICY "announcements_select_policy"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    status = 'publicado' 
    OR created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- NUEVA POLÍTICA: INSERT (Crear)
CREATE POLICY "announcements_insert_policy"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin', 'director', 'coordinator')
    )
  );

-- NUEVA POLÍTICA: UPDATE (Actualizar)
CREATE POLICY "announcements_update_policy"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    (created_by = auth.uid() AND status IN ('borrador', 'pendiente_aprobacion'))
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  )
  WITH CHECK (
    (created_by = auth.uid() AND status IN ('borrador', 'pendiente_aprobacion'))
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- NUEVA POLÍTICA: DELETE (Eliminar)
CREATE POLICY "announcements_delete_policy"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'borrador')
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director')
    )
  );

-- Verificación
SELECT 'Políticas de announcements actualizadas correctamente ✅' as status;
