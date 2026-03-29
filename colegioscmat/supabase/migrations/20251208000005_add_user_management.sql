-- =====================================================
-- MIGRACIÓN: Gestión de Usuarios - Admin Panel
-- Fecha: 2025-12-08
-- Descripción: Extiende tabla profiles para gestión completa de usuarios
-- =====================================================

-- 1. Agregar campos faltantes a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- 2. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- 4. RLS Policies - Admin y Director pueden gestionar usuarios

-- Policy: Admin/Director pueden ver todos los usuarios
CREATE POLICY "admin_director_view_all_users"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director')
  )
  OR profiles.id = auth.uid() -- Usuarios pueden verse a sí mismos
);

-- Policy: Admin/Director pueden insertar usuarios (via función)
CREATE POLICY "admin_director_insert_users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director')
  )
);

-- Policy: Admin/Director pueden actualizar usuarios
CREATE POLICY "admin_director_update_users"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director')
  )
);

-- 5. Función auxiliar para crear usuario completo
-- Esta función debe ser llamada desde el backend con privilegios de servicio
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_created_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Nota: La creación real del usuario en auth.users debe hacerse
  -- desde el servidor con la API de Supabase Auth (no desde SQL)
  -- Esta función solo prepara la estructura

  -- Validar rol
  IF p_role NOT IN ('admin', 'director', 'coordinator', 'secretary', 'teacher', 'student', 'guardian', 'finance', 'cashier', 'web_editor') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_role;
  END IF;

  -- Retornar estructura esperada
  v_result := json_build_object(
    'success', true,
    'message', 'Usar Supabase Admin API para crear usuario en auth.users',
    'email', p_email,
    'role', p_role,
    'first_name', p_first_name,
    'last_name', p_last_name
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para desactivar usuario (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que quien ejecuta es admin/director
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'No autorizado para desactivar usuarios';
  END IF;

  -- Desactivar usuario
  UPDATE profiles
  SET is_active = false
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para activar usuario
CREATE OR REPLACE FUNCTION activate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que quien ejecuta es admin/director
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'No autorizado para activar usuarios';
  END IF;

  -- Activar usuario
  UPDATE profiles
  SET is_active = true
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Comentarios
COMMENT ON COLUMN profiles.is_active IS 'Usuario activo en el sistema (soft delete)';
COMMENT ON COLUMN profiles.created_by IS 'Usuario administrador que creó este perfil';
COMMENT ON COLUMN profiles.updated_at IS 'Última actualización del perfil';
COMMENT ON FUNCTION deactivate_user IS 'Desactiva un usuario (solo admin/director)';
COMMENT ON FUNCTION activate_user IS 'Activa un usuario (solo admin/director)';

-- 9. Datos de ejemplo (opcional - comentado)
-- UPDATE profiles SET is_active = true WHERE role = 'admin';
