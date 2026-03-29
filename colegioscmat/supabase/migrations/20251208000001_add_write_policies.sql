-- Agregar políticas de escritura para tablas de configuración académica
-- Solo usuarios con roles admin/director pueden crear/editar/eliminar

-- =====================================================
-- POLICIES PARA ACADEMIC_YEARS
-- =====================================================

CREATE POLICY "Admins can insert academic years"
  ON academic_years FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update academic years"
  ON academic_years FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete academic years"
  ON academic_years FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA PERIODS
-- =====================================================

CREATE POLICY "Admins can insert periods"
  ON periods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update periods"
  ON periods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete periods"
  ON periods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA GRADE_LEVELS
-- =====================================================

CREATE POLICY "Admins can insert grade levels"
  ON grade_levels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update grade levels"
  ON grade_levels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete grade levels"
  ON grade_levels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA SECTIONS
-- =====================================================

CREATE POLICY "Admins can insert sections"
  ON sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update sections"
  ON sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete sections"
  ON sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA COURSES
-- =====================================================

CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA COMPETENCIES
-- =====================================================

CREATE POLICY "Admins can insert competencies"
  ON competencies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can update competencies"
  ON competencies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Admins can delete competencies"
  ON competencies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA EVALUATIONS (escritura)
-- =====================================================

CREATE POLICY "Teachers can insert evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'director', 'coordinator')
    )
  );

CREATE POLICY "Teachers can update evaluations"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    recorded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- =====================================================
-- POLICIES PARA ASSIGNMENTS (escritura)
-- =====================================================

CREATE POLICY "Teachers can insert assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'director', 'coordinator')
    )
  );

CREATE POLICY "Teachers can update assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'coordinator')
    )
  );

CREATE POLICY "Teachers can delete assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA ASSIGNMENT_SUBMISSIONS (escritura)
-- =====================================================

CREATE POLICY "Students can insert submissions"
  ON assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own submissions"
  ON assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ) OR
    reviewed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'director')
    )
  );

-- =====================================================
-- POLICIES PARA ANNOUNCEMENTS (lectura)
-- =====================================================

CREATE POLICY "Everyone can read published announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    status = 'publicado' OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- =====================================================
-- POLICIES PARA ANNOUNCEMENTS (escritura)
-- =====================================================

CREATE POLICY "Teachers can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'director', 'coordinator')
    )
  );

CREATE POLICY "Teachers can update own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director', 'coordinator')
    )
  );

CREATE POLICY "Teachers can delete own draft announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND status = 'borrador' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );
