-- Solución definitiva para recursión infinita en policies de profiles
-- Ejecutar este SQL en Supabase SQL Editor

-- PASO 1: Crear función SECURITY DEFINER para obtener el rol del usuario
-- Esta función puede leer profiles sin activar RLS, evitando la recursión
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id LIMIT 1;
$$;

-- PASO 2: Eliminar todas las políticas problemáticas de profiles
DROP POLICY IF EXISTS admin_director_view_all_users ON profiles;
DROP POLICY IF EXISTS admin_director_insert_users ON profiles;
DROP POLICY IF EXISTS admin_director_update_users ON profiles;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
DROP POLICY IF EXISTS profiles_insert_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;

-- PASO 3: Crear políticas usando la función SECURITY DEFINER
-- Estas NO causarán recursión porque get_user_role() no activa RLS

-- Política SELECT: usuarios ven su perfil, admin/director ven todos
CREATE POLICY profiles_select
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  public.get_user_role(auth.uid()) IN ('admin', 'director')
);

-- Política INSERT: solo admin/director pueden crear perfiles
CREATE POLICY profiles_insert
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'director')
);

-- Política UPDATE: usuarios actualizan su perfil, admin/director actualizan todos
CREATE POLICY profiles_update
ON profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid() 
  OR 
  public.get_user_role(auth.uid()) IN ('admin', 'director')
)
WITH CHECK (
  id = auth.uid() 
  OR 
  public.get_user_role(auth.uid()) IN ('admin', 'director')
);

-- NOTA: Esta solución funciona porque get_user_role() tiene SECURITY DEFINER
-- lo que significa que se ejecuta con privilegios del creador (superuser)
-- y por lo tanto NO está sujeta a las políticas RLS de profiles
