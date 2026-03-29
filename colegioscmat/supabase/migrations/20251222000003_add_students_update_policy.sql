-- =====================================================
-- Migración: Agregar política RLS para UPDATE en students
-- =====================================================
-- Problema: No existe política que permita actualizar registros de estudiantes.
-- Esto causa que el enlace user_id después de crear la cuenta falle silenciosamente.
-- =====================================================

-- Política para que admins y directores puedan actualizar estudiantes
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

-- Política para que admins y directores puedan insertar estudiantes (por si acaso)
CREATE POLICY "Admin can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- Comentario: Después de aplicar esta migración, los administradores podrán:
-- 1. Crear registros de estudiantes
-- 2. Actualizar el user_id cuando se crea la cuenta de acceso
-- 3. Cambiar secciones y otros datos de estudiantes
