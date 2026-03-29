-- =====================================================
-- Script: Auto-vincular estudiantes con sus perfiles
-- Fecha: 2025-12-09
-- Descripción: Vincula automáticamente los registros de
--              students con profiles basándose en el email
-- =====================================================

-- PASO 1: Ver el estado actual - Perfiles sin vincular
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name,
  'Sin vincular' as estado
FROM profiles p
LEFT JOIN students s ON s.user_id = p.id
WHERE p.role = 'student' AND s.id IS NULL;

-- PASO 2: Intentar vincular automáticamente por coincidencia de nombres
-- (Si el email del perfil contiene parte del nombre del estudiante)
-- NOTA: Este es un método aproximado, revisar los resultados

-- Primero, ver las posibles coincidencias
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name as profile_name,
  s.id as student_id,
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name
FROM profiles p
CROSS JOIN students s
WHERE p.role = 'student'
  AND s.user_id IS NULL
  AND (
    LOWER(p.email) LIKE '%' || LOWER(s.first_name) || '%'
    OR LOWER(p.full_name) LIKE '%' || LOWER(s.first_name) || '%'
    OR LOWER(p.full_name) LIKE '%' || LOWER(s.last_name) || '%'
  );

-- PASO 3: VINCULACIÓN MANUAL RECOMENDADA
-- Como los estudiantes tienen códigos EST000001-EST000007,
-- debes crear perfiles para cada uno o vincularlos manualmente

-- Ejemplo de vinculación manual:
-- UPDATE students SET user_id = 'UUID_DEL_PERFIL' WHERE student_code = 'EST000001';

-- PASO 4: Crear perfiles faltantes para los estudiantes
-- Si no existen perfiles, créalos primero en Authentication de Supabase
-- Luego ejecuta:

/*
-- Para cada estudiante sin user_id, después de crear su usuario en Auth:
UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'kasu@cermatschool.edu.pe')
WHERE student_code = 'EST000004';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'kasu22@cermatschool.edu.pe')
WHERE student_code = 'EST000005';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'kasu2223@cermatschool.edu.pe')
WHERE student_code = 'EST000006';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'kasu22234@cermatschool.edu.pe')
WHERE student_code = 'EST000007';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'yasmin@cermatschool.edu.pe')
WHERE student_code = 'EST000003';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'david@cermatschool.edu.pe')
WHERE student_code = 'EST000001';

UPDATE students 
SET user_id = (SELECT id FROM profiles WHERE email = 'casandra@cermatschool.edu.pe')
WHERE student_code = 'EST000002';
*/

-- PASO 5: Verificar vinculaciones después de actualizar
SELECT 
  p.email,
  p.full_name as profile_name,
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name,
  s.status,
  sec.section_letter,
  gl.name as grade
FROM profiles p
JOIN students s ON s.user_id = p.id
LEFT JOIN sections sec ON sec.id = s.section_id
LEFT JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE p.role = 'student'
ORDER BY s.student_code;

-- PASO 6: Después de vincular, matricular en cursos automáticamente
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
  AND s.user_id IS NOT NULL
  AND s.section_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM student_course_enrollments sce
    WHERE sce.student_id = s.id
      AND sce.course_id = tca.course_id
      AND sce.section_id = s.section_id
      AND sce.academic_year_id = tca.academic_year_id
  );

-- PASO 7: Verificar las matrículas
SELECT 
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name,
  c.name as course_name,
  c.code as course_code,
  sce.status as enrollment_status,
  sce.enrollment_date
FROM student_course_enrollments sce
JOIN students s ON s.id = sce.student_id
JOIN courses c ON c.id = sce.course_id
WHERE s.user_id IS NOT NULL
ORDER BY s.student_code, c.name;

-- PASO 8: Verificar asistencias existentes
SELECT 
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name,
  a.date,
  c.name as course_name,
  a.status
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN courses c ON c.id = a.course_id
WHERE s.user_id IS NOT NULL
ORDER BY a.date DESC, s.student_code
LIMIT 50;
