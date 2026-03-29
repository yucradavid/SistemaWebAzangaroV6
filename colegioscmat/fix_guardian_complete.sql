-- ========================================
-- DIAGNOSTICO Y REPARACION COMPLETA
-- Usuario: joel23444@gmail.com
-- ========================================

-- 1. Verificar usuario auth
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'joel23444@gmail.com';

-- 2. Verificar perfil y ROL
SELECT 
  id,
  role,
  full_name,
  email
FROM profiles 
WHERE email = 'joel23444@gmail.com';

-- 3. Verificar registro en tabla guardians
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  relationship
FROM guardians 
WHERE email = 'joel23444@gmail.com';

-- 4. Verificar estudiante Kaori
SELECT 
  id,
  first_name,
  last_name,
  student_code,
  user_id
FROM students 
WHERE first_name ILIKE '%kaori%';

-- 5. Verificar relación student_guardians
SELECT 
  sg.id,
  sg.student_id,
  sg.guardian_id,
  sg.is_primary,
  s.first_name || ' ' || s.last_name as student_name,
  g.first_name || ' ' || g.last_name as guardian_name
FROM student_guardians sg
JOIN students s ON s.id = sg.student_id
JOIN guardians g ON g.id = sg.guardian_id
WHERE g.email = 'joel23444@gmail.com';

-- ========================================
-- CORRECCIONES (Descomentar si es necesario)
-- ========================================

-- 6. Si el perfil tiene rol incorrecto, corregirlo a 'guardian'
-- UPDATE profiles 
-- SET role = 'guardian'
-- WHERE email = 'joel23444@gmail.com' AND role != 'guardian';

-- 7. Si NO existe la relación en student_guardians, crearla
-- INSERT INTO student_guardians (student_id, guardian_id, is_primary)
-- SELECT 
--   s.id,
--   g.id,
--   true
-- FROM students s
-- CROSS JOIN guardians g
-- WHERE s.first_name ILIKE '%kaori%'
--   AND g.email = 'joel23444@gmail.com'
-- ON CONFLICT (student_id, guardian_id) DO NOTHING;

-- ========================================
-- VERIFICACION FINAL
-- ========================================

-- 8. Verificar que todo está OK
SELECT 
  'Usuario auth' as tipo,
  COUNT(*) as cantidad
FROM auth.users 
WHERE email = 'joel23444@gmail.com'

UNION ALL

SELECT 
  'Perfil con rol guardian',
  COUNT(*)
FROM profiles 
WHERE email = 'joel23444@gmail.com' AND role = 'guardian'

UNION ALL

SELECT 
  'Registro en guardians',
  COUNT(*)
FROM guardians 
WHERE email = 'joel23444@gmail.com'

UNION ALL

SELECT 
  'Relaciones activas',
  COUNT(*)
FROM student_guardians sg
JOIN guardians g ON g.id = sg.guardian_id
WHERE g.email = 'joel23444@gmail.com';
