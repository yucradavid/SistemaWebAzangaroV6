-- ========================================
-- CREAR RELACION GUARDIAN-ESTUDIANTE
-- ========================================

-- 1. Primero verificar IDs exactos
SELECT 
  'Estudiante Kaori' as tipo,
  id::text as id,
  first_name,
  last_name
FROM students 
WHERE first_name ILIKE '%kaori%'

UNION ALL

SELECT 
  'Guardian joel23444',
  id::text,
  first_name,
  last_name
FROM guardians 
WHERE email = 'joel23444@gmail.com';

-- 2. Verificar si YA existe la relación
SELECT * FROM student_guardians 
WHERE guardian_id IN (
  SELECT id FROM guardians WHERE email = 'joel23444@gmail.com'
);

-- 3. CREAR la relación (ejecutar SIEMPRE)
INSERT INTO student_guardians (student_id, guardian_id, is_primary)
SELECT 
  s.id,
  g.id,
  true
FROM students s
CROSS JOIN guardians g
WHERE s.first_name ILIKE '%kaori%'
  AND g.email = 'joel23444@gmail.com'
ON CONFLICT (student_id, guardian_id) DO UPDATE 
SET is_primary = true;

-- 4. Verificar que se creó correctamente
SELECT 
  sg.id,
  sg.student_id,
  sg.guardian_id,
  sg.is_primary,
  s.first_name || ' ' || s.last_name as student_name,
  g.first_name || ' ' || g.last_name as guardian_name,
  g.email
FROM student_guardians sg
JOIN students s ON s.id = sg.student_id
JOIN guardians g ON g.id = sg.guardian_id
WHERE g.email = 'joel23444@gmail.com';

-- 5. Verificar políticas RLS de student_guardians
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'student_guardians';
