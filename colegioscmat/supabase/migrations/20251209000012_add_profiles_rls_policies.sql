-- Agregar políticas RLS para la tabla profiles
-- Esto permite que se puedan crear perfiles desde el frontend

-- Los usuarios autenticados pueden leer su propio perfil y perfiles públicos
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- Los usuarios pueden insertar su propio perfil (necesario para signUp)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Los usuarios autenticados pueden insertar perfiles (necesario para crear estudiantes)
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo admins pueden actualizar perfiles
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director', 'coordinator')
    )
  );

-- Solo admins pueden eliminar perfiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'director')
    )
  );
