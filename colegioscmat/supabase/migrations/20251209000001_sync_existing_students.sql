/*
  # Script para sincronizar estudiantes existentes con cursos

  Este script debe ejecutarse DESPUÉS de crear la tabla student_course_enrollments.
  Inscribe automáticamente a todos los estudiantes activos en los cursos de su sección.
*/

DO $$
DECLARE
  v_academic_year_id UUID;
  v_student RECORD;
  v_course RECORD;
  v_count INT := 0;
BEGIN
  -- Obtener año académico activo
  SELECT id INTO v_academic_year_id
  FROM academic_years
  WHERE is_active = TRUE
  LIMIT 1;

  IF v_academic_year_id IS NULL THEN
    RAISE NOTICE 'No hay año académico activo. No se puede sincronizar.';
    RETURN;
  END IF;

  RAISE NOTICE 'Sincronizando estudiantes con año académico: %', v_academic_year_id;

  -- Iterar sobre todos los estudiantes activos que tienen sección asignada
  FOR v_student IN
    SELECT id, section_id, first_name, last_name, student_code
    FROM students
    WHERE status = 'active' AND section_id IS NOT NULL
  LOOP
    -- Inscribir en todos los cursos asignados a su sección
    FOR v_course IN
      SELECT DISTINCT course_id, courses.name as course_name
      FROM teacher_course_assignments tca
      JOIN courses ON courses.id = tca.course_id
      WHERE tca.section_id = v_student.section_id
        AND tca.academic_year_id = v_academic_year_id
        AND tca.is_active = TRUE
    LOOP
      -- Insertar inscripción si no existe
      INSERT INTO student_course_enrollments (
        student_id,
        course_id,
        section_id,
        academic_year_id,
        status
      ) VALUES (
        v_student.id,
        v_course.course_id,
        v_student.section_id,
        v_academic_year_id,
        'active'
      )
      ON CONFLICT (student_id, course_id, academic_year_id) 
      DO NOTHING;

      v_count := v_count + 1;
      
      IF v_count % 10 = 0 THEN
        RAISE NOTICE 'Procesados % inscripciones...', v_count;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Sincronización completada. Total inscripciones procesadas: %', v_count;
  
  -- Mostrar resumen
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN DE SINCRONIZACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Estudiantes activos: %', (SELECT COUNT(*) FROM students WHERE status = 'active');
  RAISE NOTICE 'Estudiantes con sección: %', (SELECT COUNT(*) FROM students WHERE status = 'active' AND section_id IS NOT NULL);
  RAISE NOTICE 'Total inscripciones activas: %', (SELECT COUNT(*) FROM student_course_enrollments WHERE status = 'active');
  RAISE NOTICE '========================================';
  
END $$;

-- Verificar el resultado
SELECT 
  s.student_code,
  s.first_name,
  s.last_name,
  sec.section_letter,
  gl.name as grade_level,
  COUNT(sce.id) as enrolled_courses
FROM students s
LEFT JOIN sections sec ON sec.id = s.section_id
LEFT JOIN grade_levels gl ON gl.id = sec.grade_level_id
LEFT JOIN student_course_enrollments sce ON sce.student_id = s.id AND sce.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.student_code, s.first_name, s.last_name, sec.section_letter, gl.name
ORDER BY gl.name, sec.section_letter, s.last_name;
