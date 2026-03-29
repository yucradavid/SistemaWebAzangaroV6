-- =====================================================
-- EJECUTAR MIGRACIONES PENDIENTES (6, 7, 8)
-- Copiar y pegar este archivo completo en Supabase SQL Editor
-- Fecha: 2025-12-09
-- =====================================================

-- =====================================================
-- MIGRACIÓN 6: Entregas de Tareas con Adjuntos
-- =====================================================

-- 1. Crear tabla task_submissions
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ DEFAULT now(),
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  grade DECIMAL(5,2),
  grade_letter TEXT CHECK (grade_letter IN ('AD', 'A', 'B', 'C', NULL)),
  feedback TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_assignment ON task_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student ON task_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_graded ON task_submissions(graded_at);

CREATE OR REPLACE FUNCTION update_task_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_submissions_updated_at ON task_submissions;
CREATE TRIGGER task_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_submissions_updated_at();

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_view_own_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "students_insert_own_submissions"
ON task_submissions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "students_update_own_submissions"
ON task_submissions FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND status IN ('draft', 'submitted')
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "teachers_view_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'director', 'coordinator')
);

CREATE POLICY "teachers_update_submissions"
ON task_submissions FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'director', 'coordinator')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'director', 'coordinator')
);

CREATE POLICY "guardians_view_children_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT sg.student_id FROM student_guardians sg
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE g.user_id = auth.uid()
  )
);

-- =====================================================
-- MIGRACIÓN 7: Sistema de Matrícula con Aprobación
-- =====================================================

CREATE TABLE IF NOT EXISTS enrollment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_document_type TEXT NOT NULL CHECK (student_document_type IN ('DNI', 'CE', 'Pasaporte')),
  student_document_number TEXT NOT NULL,
  student_birth_date DATE NOT NULL,
  student_gender TEXT NOT NULL CHECK (student_gender IN ('M', 'F')),
  student_address TEXT,
  student_photo_url TEXT,
  guardian_first_name TEXT NOT NULL,
  guardian_last_name TEXT NOT NULL,
  guardian_document_type TEXT NOT NULL CHECK (guardian_document_type IN ('DNI', 'CE', 'Pasaporte')),
  guardian_document_number TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_address TEXT,
  guardian_relationship TEXT NOT NULL CHECK (guardian_relationship IN ('Padre', 'Madre', 'Tutor', 'Otro')),
  grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
  previous_school TEXT,
  has_special_needs BOOLEAN DEFAULT false,
  special_needs_description TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  application_date TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_applications_status ON enrollment_applications(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_academic_year ON enrollment_applications(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_grade_level ON enrollment_applications(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_application_date ON enrollment_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_guardian_email ON enrollment_applications(guardian_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_student_document ON enrollment_applications(student_document_number);

CREATE OR REPLACE FUNCTION update_enrollment_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_applications_updated_at ON enrollment_applications;
CREATE TRIGGER enrollment_applications_updated_at
  BEFORE UPDATE ON enrollment_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_applications_updated_at();

ALTER TABLE enrollment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_can_create_applications"
ON enrollment_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "staff_view_all_applications"
ON enrollment_applications FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'secretary', 'coordinator')
);

CREATE POLICY "guardians_view_own_applications"
ON enrollment_applications FOR SELECT
TO authenticated
USING (
  guardian_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "staff_update_applications"
ON enrollment_applications FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'secretary', 'coordinator')
)
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'secretary', 'coordinator')
);

CREATE POLICY "admin_delete_applications"
ON enrollment_applications FOR DELETE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director')
);

-- =====================================================
-- MIGRACIÓN 8: Asignaciones Docente-Curso
-- =====================================================

CREATE TABLE IF NOT EXISTS teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, section_id, course_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_course_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section ON teacher_course_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_course ON teacher_course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_academic_year ON teacher_course_assignments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_active ON teacher_course_assignments(is_active);

CREATE OR REPLACE FUNCTION update_teacher_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_teacher_assignments_updated_at ON teacher_course_assignments;
CREATE TRIGGER trigger_update_teacher_assignments_updated_at
  BEFORE UPDATE ON teacher_course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_assignments_updated_at();

CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_course_count INTEGER;
  max_courses_per_teacher INTEGER := 6;
BEGIN
  SELECT COUNT(DISTINCT course_id)
  INTO current_course_count
  FROM teacher_course_assignments
  WHERE teacher_id = NEW.teacher_id
    AND academic_year_id = NEW.academic_year_id
    AND is_active = TRUE
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF current_course_count >= max_courses_per_teacher THEN
    RAISE EXCEPTION 'El docente ya tiene % cursos asignados. Máximo permitido: %', 
      current_course_count, max_courses_per_teacher;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_teacher_course_limit ON teacher_course_assignments;
CREATE TRIGGER trigger_validate_teacher_course_limit
  BEFORE INSERT OR UPDATE ON teacher_course_assignments
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION validate_teacher_course_limit();

CREATE OR REPLACE FUNCTION get_teacher_course_load(
  p_teacher_id UUID,
  p_academic_year_id UUID
)
RETURNS TABLE (
  course_name VARCHAR(200),
  section_name VARCHAR(50),
  grade_level_name VARCHAR(100),
  total_assignments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name AS course_name,
    s.section_letter AS section_name,
    gl.name AS grade_level_name,
    COUNT(*) AS total_assignments
  FROM teacher_course_assignments tca
  INNER JOIN courses c ON tca.course_id = c.id
  INNER JOIN sections s ON tca.section_id = s.id
  INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
  WHERE tca.teacher_id = p_teacher_id
    AND tca.academic_year_id = p_academic_year_id
    AND tca.is_active = TRUE
  GROUP BY c.name, s.name, gl.name
  ORDER BY gl.name, s.name, c.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW teacher_assignments_view AS
SELECT 
  tca.id,
  tca.teacher_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  p.email AS teacher_email,
  tca.section_id,
  sec.section_letter AS section_name,
  gl.id AS grade_level_id,
  gl.name AS grade_level_name,
  gl.level,
  tca.course_id,
  c.name AS course_name,
  c.code AS course_code,
  tca.academic_year_id,
  ay.year AS academic_year,
  ay.is_active AS is_current_year,
  tca.is_active,
  tca.assigned_at,
  tca.notes,
  (SELECT COUNT(*) FROM students st WHERE st.section_id = tca.section_id AND st.status = 'active') AS student_count
FROM teacher_course_assignments tca
INNER JOIN teachers t ON tca.teacher_id = t.id
INNER JOIN profiles p ON t.user_id = p.id
INNER JOIN sections sec ON tca.section_id = sec.id
INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
INNER JOIN courses c ON tca.course_id = c.id
INNER JOIN academic_years ay ON tca.academic_year_id = ay.id
WHERE tca.is_active = TRUE;

CREATE OR REPLACE VIEW teacher_assignment_stats AS
SELECT 
  t.id AS teacher_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  COUNT(DISTINCT tca.course_id) AS total_courses,
  COUNT(DISTINCT tca.section_id) AS total_sections,
  SUM((SELECT COUNT(*) FROM students st WHERE st.section_id = tca.section_id AND st.status = 'active')) AS total_students,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS courses_list
FROM teachers t
LEFT JOIN teacher_course_assignments tca ON t.id = tca.teacher_id AND tca.is_active = TRUE
LEFT JOIN courses c ON tca.course_id = c.id
WHERE t.status = 'active'
GROUP BY t.id, t.first_name, t.last_name
ORDER BY t.last_name, t.first_name;

ALTER TABLE teacher_course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_director_view_all_assignments"
ON teacher_course_assignments FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator')
);

CREATE POLICY "teachers_view_own_assignments"
ON teacher_course_assignments FOR SELECT
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "admin_create_assignments"
ON teacher_course_assignments FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator')
);

CREATE POLICY "admin_update_assignments"
ON teacher_course_assignments FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator')
);

CREATE POLICY "admin_delete_assignments"
ON teacher_course_assignments FOR DELETE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('admin', 'director')
);

-- =====================================================
-- FIN - Todas las migraciones completadas
-- =====================================================
