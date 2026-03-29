-- =====================================================
-- Script: Sincronizar matrículas de estudiantes
-- Fecha: 2025-12-09
-- Descripción: Matricula automáticamente a los estudiantes
--              en los cursos asignados a su sección
-- =====================================================

-- Insertar matrículas para todos los estudiantes activos
-- basándose en las asignaciones de docentes a cursos por sección
INSERT INTO student_course_enrollments (
  student_id,
  course_id,
  section_id,
  academic_year_id,
  enrollment_date,
  status
)
SELECT DISTINCT
  s.id as student_id,
  tca.course_id,
  s.section_id,
  tca.academic_year_id,
  CURRENT_DATE as enrollment_date,
  'active' as status
FROM students s
JOIN teacher_course_assignments tca ON tca.section_id = s.section_id
WHERE 
  s.status = 'active'
  AND s.section_id IS NOT NULL
  AND NOT EXISTS (
    -- Evitar duplicados
    SELECT 1 
    FROM student_course_enrollments sce
    WHERE sce.student_id = s.id
      AND sce.course_id = tca.course_id
      AND sce.section_id = s.section_id
      AND sce.academic_year_id = tca.academic_year_id
  );

-- Mostrar resultado
DO $$
DECLARE
  enrolled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enrolled_count
  FROM student_course_enrollments
  WHERE enrollment_date = CURRENT_DATE;
  
  RAISE NOTICE 'Matrículas sincronizadas: % estudiantes matriculados', enrolled_count;
END $$;
