-- =====================================================
-- Migration: Add Teacher Course Assignments
-- Description: Permite asignar cursos a docentes en secciones específicas
-- Date: 2024-12-08
-- =====================================================

-- 1. Crear tabla de asignaciones docente-curso
CREATE TABLE IF NOT EXISTS teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  
  -- Metadata
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Restricción: Un docente no puede tener el mismo curso en la misma sección
  UNIQUE(teacher_id, section_id, course_id, academic_year_id)
);

COMMENT ON TABLE teacher_course_assignments IS 'Asignaciones de cursos a docentes por sección y año académico';
COMMENT ON COLUMN teacher_course_assignments.teacher_id IS 'Docente asignado';
COMMENT ON COLUMN teacher_course_assignments.section_id IS 'Sección donde dicta el curso';
COMMENT ON COLUMN teacher_course_assignments.course_id IS 'Curso que dicta';
COMMENT ON COLUMN teacher_course_assignments.academic_year_id IS 'Año académico de la asignación';
COMMENT ON COLUMN teacher_course_assignments.assigned_by IS 'Usuario que creó la asignación';
COMMENT ON COLUMN teacher_course_assignments.is_active IS 'Si la asignación está activa';

-- 2. Crear índices para optimizar consultas
CREATE INDEX idx_teacher_assignments_teacher ON teacher_course_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_section ON teacher_course_assignments(section_id);
CREATE INDEX idx_teacher_assignments_course ON teacher_course_assignments(course_id);
CREATE INDEX idx_teacher_assignments_academic_year ON teacher_course_assignments(academic_year_id);
CREATE INDEX idx_teacher_assignments_active ON teacher_course_assignments(is_active);

-- 3. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_teacher_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_teacher_assignments_updated_at
  BEFORE UPDATE ON teacher_course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_assignments_updated_at();

-- 4. Crear función para validar máximo de cursos por docente
CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_course_count INTEGER;
  max_courses_per_teacher INTEGER := 6;
BEGIN
  -- Contar cursos activos del docente en el año académico actual
  SELECT COUNT(DISTINCT course_id)
  INTO current_course_count
  FROM teacher_course_assignments
  WHERE teacher_id = NEW.teacher_id
    AND academic_year_id = NEW.academic_year_id
    AND is_active = TRUE
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  -- Validar que no exceda el máximo
  IF current_course_count >= max_courses_per_teacher THEN
    RAISE EXCEPTION 'El docente ya tiene % cursos asignados. Máximo permitido: %', 
      current_course_count, max_courses_per_teacher;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_teacher_course_limit
  BEFORE INSERT OR UPDATE ON teacher_course_assignments
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION validate_teacher_course_limit();

-- 5. Crear función para obtener carga horaria del docente
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
    s.name AS section_name,
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

COMMENT ON FUNCTION get_teacher_course_load IS 'Obtiene la carga horaria de un docente para un año académico';

-- 6. Crear vista para asignaciones con información completa
CREATE OR REPLACE VIEW teacher_assignments_view AS
SELECT 
  tca.id,
  tca.teacher_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  p.email AS teacher_email,
  tca.section_id,
  s.name AS section_name,
  gl.id AS grade_level_id,
  gl.name AS grade_level_name,
  gl.level_type,
  tca.course_id,
  c.name AS course_name,
  c.code AS course_code,
  tca.academic_year_id,
  ay.year AS academic_year,
  ay.is_active AS is_current_year,
  tca.is_active,
  tca.assigned_at,
  tca.notes,
  -- Contador de estudiantes en la sección
  (SELECT COUNT(*) FROM students st WHERE st.section_id = s.id AND st.is_active = TRUE) AS student_count
FROM teacher_course_assignments tca
INNER JOIN teachers t ON tca.teacher_id = t.id
INNER JOIN profiles p ON t.user_id = p.id
INNER JOIN sections s ON tca.section_id = s.id
INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
INNER JOIN courses c ON tca.course_id = c.id
INNER JOIN academic_years ay ON tca.academic_year_id = ay.id
WHERE tca.is_active = TRUE;

COMMENT ON VIEW teacher_assignments_view IS 'Vista completa de asignaciones de docentes con información relacionada';

-- 7. Crear vista de estadísticas de asignaciones
CREATE OR REPLACE VIEW teacher_assignment_stats AS
SELECT 
  t.id AS teacher_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  COUNT(DISTINCT tca.course_id) AS total_courses,
  COUNT(DISTINCT tca.section_id) AS total_sections,
  SUM((SELECT COUNT(*) FROM students st WHERE st.section_id = tca.section_id AND st.is_active = TRUE)) AS total_students,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) AS courses_list
FROM teachers t
LEFT JOIN teacher_course_assignments tca ON t.id = tca.teacher_id AND tca.is_active = TRUE
LEFT JOIN courses c ON tca.course_id = c.id
WHERE t.is_active = TRUE
GROUP BY t.id, t.first_name, t.last_name
ORDER BY t.last_name, t.first_name;

COMMENT ON VIEW teacher_assignment_stats IS 'Estadísticas de asignaciones por docente';

-- 8. Políticas RLS (Row Level Security)
ALTER TABLE teacher_course_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Admin y Director pueden ver todas las asignaciones
CREATE POLICY "admin_director_view_all_assignments"
ON teacher_course_assignments
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'director', 'coordinator')
  )
);

-- Policy: Docentes pueden ver sus propias asignaciones
CREATE POLICY "teachers_view_own_assignments"
ON teacher_course_assignments
FOR SELECT
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Policy: Solo admin/director/coordinator pueden crear asignaciones
CREATE POLICY "admin_create_assignments"
ON teacher_course_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'director', 'coordinator')
  )
);

-- Policy: Solo admin/director/coordinator pueden actualizar asignaciones
CREATE POLICY "admin_update_assignments"
ON teacher_course_assignments
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'director', 'coordinator')
  )
);

-- Policy: Solo admin/director pueden eliminar asignaciones
CREATE POLICY "admin_delete_assignments"
ON teacher_course_assignments
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'director')
  )
);

-- 9. Insertar datos de ejemplo (comentados - descomentar si se desea)
/*
-- Ejemplo: Asignar "Matemática" a un docente en una sección
INSERT INTO teacher_course_assignments (
  teacher_id, 
  section_id, 
  course_id, 
  academic_year_id,
  assigned_by
)
VALUES (
  (SELECT id FROM teachers WHERE email = 'profesor@example.com' LIMIT 1),
  (SELECT id FROM sections WHERE name = 'A' AND grade_level_id = (SELECT id FROM grade_levels WHERE name = '1ro Primaria') LIMIT 1),
  (SELECT id FROM courses WHERE name = 'Matemática' LIMIT 1),
  (SELECT id FROM academic_years WHERE is_active = TRUE LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);
*/

-- =====================================================
-- Fin de migración
-- =====================================================
