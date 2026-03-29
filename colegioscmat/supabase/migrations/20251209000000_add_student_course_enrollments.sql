/*
  # Tabla de inscripción de estudiantes a cursos
  
  Problema:
  - Actualmente no hay relación explícita entre students y courses
  - La relación es implícita: student -> section -> teacher_course_assignments
  - Esto dificulta consultas y permisos RLS
  
  Solución:
  - Crear tabla student_course_enrollments
  - Auto-inscribir estudiante a cursos cuando se asigna a una sección
  - Mantener sincronizado cuando cambian asignaciones de docentes
*/

-- Tabla de inscripción de estudiantes a cursos
CREATE TABLE IF NOT EXISTS student_course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un estudiante no puede estar inscrito dos veces en el mismo curso en el mismo año
  UNIQUE(student_id, course_id, academic_year_id)
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_student_course_enrollments_student ON student_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_course_enrollments_course ON student_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_student_course_enrollments_section ON student_course_enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_student_course_enrollments_year ON student_course_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_course_enrollments_status ON student_course_enrollments(status);

-- Habilitar RLS
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_student_course_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_course_enrollments_updated_at ON student_course_enrollments;

CREATE TRIGGER trigger_update_student_course_enrollments_updated_at
  BEFORE UPDATE ON student_course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_student_course_enrollments_updated_at();

-- =====================================================
-- FUNCIÓN: Auto-inscribir estudiante a cursos de su sección
-- =====================================================

CREATE OR REPLACE FUNCTION auto_enroll_student_to_section_courses()
RETURNS TRIGGER AS $$
DECLARE
  v_academic_year_id UUID;
  v_course RECORD;
BEGIN
  -- Solo procesar cuando se asigna o cambia de sección (y el estudiante está activo)
  IF (NEW.section_id IS NOT NULL AND NEW.status = 'active') AND 
     (OLD IS NULL OR OLD.section_id IS DISTINCT FROM NEW.section_id OR OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Obtener año académico activo
    SELECT id INTO v_academic_year_id
    FROM academic_years
    WHERE is_active = TRUE
    LIMIT 1;
    
    IF v_academic_year_id IS NULL THEN
      RAISE EXCEPTION 'No hay año académico activo';
    END IF;
    
    -- Si cambió de sección, marcar cursos antiguos como dropped
    IF OLD IS NOT NULL AND OLD.section_id IS NOT NULL AND OLD.section_id != NEW.section_id THEN
      UPDATE student_course_enrollments
      SET status = 'dropped'
      WHERE student_id = NEW.id 
        AND section_id = OLD.section_id
        AND academic_year_id = v_academic_year_id
        AND status = 'active';
    END IF;
    
    -- Inscribir en todos los cursos asignados a la nueva sección
    FOR v_course IN
      SELECT DISTINCT course_id
      FROM teacher_course_assignments
      WHERE section_id = NEW.section_id
        AND academic_year_id = v_academic_year_id
        AND is_active = TRUE
    LOOP
      -- Insertar solo si no existe
      INSERT INTO student_course_enrollments (
        student_id,
        course_id,
        section_id,
        academic_year_id,
        status
      ) VALUES (
        NEW.id,
        v_course.course_id,
        NEW.section_id,
        v_academic_year_id,
        'active'
      )
      ON CONFLICT (student_id, course_id, academic_year_id) 
      DO UPDATE SET 
        status = 'active',
        section_id = NEW.section_id,
        enrollment_date = NOW();
    END LOOP;
  END IF;
  
  -- Si el estudiante se retira, marcar todos sus cursos como dropped
  IF NEW.status != 'active' AND (OLD IS NULL OR OLD.status != NEW.status) THEN
    UPDATE student_course_enrollments
    SET status = 'dropped'
    WHERE student_id = NEW.id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en students para auto-inscribir
DROP TRIGGER IF EXISTS trigger_auto_enroll_student_courses ON students;

CREATE TRIGGER trigger_auto_enroll_student_courses
  AFTER INSERT OR UPDATE OF section_id, status ON students
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_student_to_section_courses();

-- =====================================================
-- FUNCIÓN: Sincronizar cuando se asigna nuevo curso a sección
-- =====================================================

CREATE OR REPLACE FUNCTION sync_student_enrollments_on_teacher_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Solo procesar cuando se crea o activa una asignación
  IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN
    
    -- Inscribir a todos los estudiantes activos de esa sección en el curso
    FOR v_student IN
      SELECT id
      FROM students
      WHERE section_id = NEW.section_id
        AND status = 'active'
    LOOP
      INSERT INTO student_course_enrollments (
        student_id,
        course_id,
        section_id,
        academic_year_id,
        status
      ) VALUES (
        v_student.id,
        NEW.course_id,
        NEW.section_id,
        NEW.academic_year_id,
        'active'
      )
      ON CONFLICT (student_id, course_id, academic_year_id) 
      DO UPDATE SET 
        status = 'active',
        section_id = NEW.section_id,
        enrollment_date = NOW();
    END LOOP;
  END IF;
  
  -- Si se desactiva la asignación, marcar inscripciones como dropped
  IF NEW.is_active = FALSE AND (OLD IS NULL OR OLD.is_active = TRUE) THEN
    UPDATE student_course_enrollments
    SET status = 'dropped'
    WHERE course_id = NEW.course_id
      AND section_id = NEW.section_id
      AND academic_year_id = NEW.academic_year_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en teacher_course_assignments
DROP TRIGGER IF EXISTS trigger_sync_student_enrollments ON teacher_course_assignments;

CREATE TRIGGER trigger_sync_student_enrollments
  AFTER INSERT OR UPDATE OF is_active ON teacher_course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_enrollments_on_teacher_assignment();

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "admin_staff_view_all_enrollments" ON student_course_enrollments;
DROP POLICY IF EXISTS "teachers_view_their_course_enrollments" ON student_course_enrollments;
DROP POLICY IF EXISTS "students_view_own_enrollments" ON student_course_enrollments;
DROP POLICY IF EXISTS "guardians_view_children_enrollments" ON student_course_enrollments;
DROP POLICY IF EXISTS "admin_staff_manage_enrollments" ON student_course_enrollments;

-- Admin/Director/Coordinador/Secretaria ven todas las inscripciones
CREATE POLICY "admin_staff_view_all_enrollments"
  ON student_course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator', 'secretary')
  );

-- Docentes ven inscripciones de sus cursos
CREATE POLICY "teachers_view_their_course_enrollments"
  ON student_course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    course_id IN (
      SELECT tca.course_id
      FROM teacher_course_assignments tca
      JOIN teachers t ON t.id = tca.teacher_id
      WHERE t.user_id = auth.uid()
        AND tca.is_active = TRUE
    )
  );

-- Estudiantes ven solo sus propias inscripciones
CREATE POLICY "students_view_own_enrollments"
  ON student_course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Apoderados ven inscripciones de sus hijos
CREATE POLICY "guardians_view_children_enrollments"
  ON student_course_enrollments
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id
      FROM students s
      JOIN student_guardians sg ON sg.student_id = s.id
      JOIN guardians g ON g.id = sg.guardian_id
      WHERE g.user_id = auth.uid()
    )
  );

-- Solo admin/director/coordinador/secretaria pueden modificar inscripciones manualmente
CREATE POLICY "admin_staff_manage_enrollments"
  ON student_course_enrollments
  FOR ALL
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator', 'secretary')
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'director', 'coordinator', 'secretary')
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE student_course_enrollments IS 'Inscripciones de estudiantes a cursos específicos';
COMMENT ON COLUMN student_course_enrollments.status IS 'active: inscrito actualmente, dropped: dado de baja, completed: curso completado';
COMMENT ON FUNCTION auto_enroll_student_to_section_courses IS 'Auto-inscribe al estudiante en todos los cursos de su sección cuando se matricula';
COMMENT ON FUNCTION sync_student_enrollments_on_teacher_assignment IS 'Sincroniza inscripciones cuando se asigna un nuevo curso a una sección';
