-- Verificar relación estudiante-apoderado para Kaori

-- 1. Verificar estudiante Kaori
SELECT 
  id,
  first_name,
  last_name,
  student_code,
  user_id
FROM students 
WHERE first_name ILIKE '%kaori%';

-- 2. Verificar apoderado joel23444
SELECT 
  id,
  first_name,
  last_name,
  email,
  user_id
FROM guardians 
WHERE email ILIKE '%joel23444%';

-- 3. Verificar relación en student_guardians
SELECT 
  sg.id,
  sg.student_id,
  sg.guardian_id,
  sg.is_primary,
  s.first_name || ' ' || s.last_name as student_name,
  g.first_name || ' ' || g.last_name as guardian_name,
  g.email as guardian_email,
  g.relationship as guardian_relationship
FROM student_guardians sg
JOIN students s ON s.id = sg.student_id
JOIN guardians g ON g.id = sg.guardian_id
WHERE s.first_name ILIKE '%kaori%' OR g.email ILIKE '%joel23444%';

-- 4. Si NO existe la relación, crearla manualmente
-- (Descomentar y ejecutar solo si el SELECT anterior no devuelve resultados)

-- INSERT INTO student_guardians (student_id, guardian_id, is_primary)
-- SELECT 
--   s.id,
--   g.id,
--   true
-- FROM students s
-- CROSS JOIN guardians g
-- WHERE s.first_name ILIKE '%kaori%'
--   AND g.email ILIKE '%joel23444%'
-- ON CONFLICT DO NOTHING;
