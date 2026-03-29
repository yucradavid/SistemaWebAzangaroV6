-- =====================================================
-- Script: Vincular usuarios estudiantes con tabla students
-- Fecha: 2025-12-09
-- Descripción: Verifica y corrige la vinculación entre
--              profiles de estudiantes y la tabla students
-- =====================================================

-- PASO 1: Ver estudiantes que tienen perfil pero no registro en students
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  s.id as student_id,
  s.student_code
FROM profiles p
LEFT JOIN students s ON s.user_id = p.id
WHERE p.role = 'student'
ORDER BY p.email;

-- PASO 2: Si hay estudiantes sin registro, verificar qué estudiantes existen sin user_id
SELECT 
  s.id,
  s.student_code,
  s.first_name,
  s.last_name,
  s.user_id,
  s.status,
  sec.section_letter,
  gl.name as grade
FROM students s
LEFT JOIN sections sec ON sec.id = s.section_id
LEFT JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE s.user_id IS NULL
ORDER BY s.last_name;

-- PASO 3: IMPORTANTE - Actualizar manualmente el user_id del estudiante
-- Reemplaza los valores según tu caso:
-- 
-- UPDATE students 
-- SET user_id = 'UUID_DEL_PERFIL_ESTUDIANTE'  -- El ID del perfil (de la tabla profiles)
-- WHERE student_code = 'EST-2025-001';          -- O usa el ID: id = 'UUID_DEL_ESTUDIANTE'
--
-- Ejemplo:
-- UPDATE students 
-- SET user_id = '8a3c7f2e-1234-5678-9abc-def012345678'
-- WHERE student_code = 'EST-2025-001';

-- PASO 4: Verificar la vinculación después de actualizar
SELECT 
  p.email,
  p.full_name as profile_name,
  p.role,
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

-- PASO 5: Verificar matrículas del estudiante
SELECT 
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name,
  c.name as course_name,
  c.code as course_code,
  sec.section_letter,
  gl.name as grade,
  sce.status as enrollment_status,
  sce.enrollment_date
FROM student_course_enrollments sce
JOIN students s ON s.id = sce.student_id
JOIN courses c ON c.id = sce.course_id
JOIN sections sec ON sec.id = sce.section_id
JOIN grade_levels gl ON gl.id = sec.grade_level_id
WHERE s.user_id IS NOT NULL
ORDER BY s.student_code, c.name;

-- PASO 6: Verificar asistencias del estudiante
SELECT 
  s.student_code,
  s.first_name || ' ' || s.last_name as student_name,
  a.date,
  c.name as course_name,
  a.status,
  a.justification
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN courses c ON c.id = a.course_id
WHERE s.user_id IS NOT NULL
ORDER BY a.date DESC, s.student_code
LIMIT 50;
