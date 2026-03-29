-- Actualizar correos electrónicos de estudiantes al nuevo formato student-{dni}@cermat.edu.pe
-- Esto actualiza tanto la tabla profiles como auth.users

-- Actualizar emails en la tabla profiles
UPDATE profiles
SET email = CONCAT('student-', s.dni, '@cermat.edu.pe')
FROM students s
WHERE profiles.id = s.user_id
  AND s.user_id IS NOT NULL
  AND s.dni IS NOT NULL
  AND profiles.role = 'student';

-- Nota: Para actualizar auth.users necesitas usar la Admin API de Supabase
-- o el Supabase Dashboard → Authentication → Users → Editar cada usuario manualmente
-- 
-- Alternativamente, puedes ejecutar esto usando una Edge Function con service_role:
-- 
-- UPDATE auth.users
-- SET email = CONCAT('student-', s.dni, '@cermat.edu.pe'),
--     raw_user_meta_data = jsonb_set(
--       raw_user_meta_data,
--       '{email}',
--       to_jsonb(CONCAT('student-', s.dni, '@cermat.edu.pe'))
--     )
-- FROM students s
-- WHERE auth.users.id = s.user_id
--   AND s.user_id IS NOT NULL
--   AND s.dni IS NOT NULL;

-- Por ahora, los usuarios existentes deberán usar sus credenciales originales
-- o puedes eliminarlos y volver a aprobar sus solicitudes de matrícula
