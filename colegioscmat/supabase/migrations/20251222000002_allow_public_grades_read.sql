-- =====================================================
-- PARCHE: Permitir lectura pública de grados y años académicos
-- Para que usuarios NO autenticados puedan ver los grados
-- en el formulario de admisiones públicas
-- =====================================================

-- 1. Política para que usuarios anónimos puedan leer grade_levels
DROP POLICY IF EXISTS "Public can read grade levels" ON grade_levels;
CREATE POLICY "Public can read grade levels"
  ON grade_levels FOR SELECT
  TO anon
  USING (true);

-- 2. Política para que usuarios anónimos puedan leer academic_years
DROP POLICY IF EXISTS "Public can read academic years" ON academic_years;
CREATE POLICY "Public can read academic years"
  ON academic_years FOR SELECT
  TO anon
  USING (true);

-- 3. Política para que usuarios anónimos puedan insertar enrollment_applications
-- (para el formulario público de admisiones)
DROP POLICY IF EXISTS "Anyone can submit enrollment application" ON enrollment_applications;
CREATE POLICY "Anyone can submit enrollment application"
  ON enrollment_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Política para que usuarios anónimos puedan leer sus propias aplicaciones
-- (por si necesitan ver el estado después)
DROP POLICY IF EXISTS "Applicants can read own applications" ON enrollment_applications;
CREATE POLICY "Applicants can read own applications"
  ON enrollment_applications FOR SELECT
  TO anon, authenticated
  USING (
    guardian_email = current_setting('request.headers', true)::json->>'x-applicant-email'
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'secretary', 'coordinator')
    )
  );

SELECT 'Políticas públicas para admisiones creadas exitosamente ✅' as status;
