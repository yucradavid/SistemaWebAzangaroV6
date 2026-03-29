-- =====================================================
-- MIGRACIÓN: Sistema de Matrícula con Aprobación
-- Fecha: 2025-12-08
-- Descripción: Tabla para solicitudes de matrícula con flujo de aprobación
-- =====================================================

-- 1. Crear tabla enrollment_applications
CREATE TABLE IF NOT EXISTS enrollment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del estudiante
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_document_type TEXT NOT NULL CHECK (student_document_type IN ('DNI', 'CE', 'Pasaporte')),
  student_document_number TEXT NOT NULL,
  student_birth_date DATE NOT NULL,
  student_gender TEXT NOT NULL CHECK (student_gender IN ('M', 'F')),
  student_address TEXT,
  student_photo_url TEXT,
  
  -- Información del apoderado
  guardian_first_name TEXT NOT NULL,
  guardian_last_name TEXT NOT NULL,
  guardian_document_type TEXT NOT NULL CHECK (guardian_document_type IN ('DNI', 'CE', 'Pasaporte')),
  guardian_document_number TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_address TEXT,
  guardian_relationship TEXT NOT NULL CHECK (guardian_relationship IN ('Padre', 'Madre', 'Tutor', 'Otro')),
  
  -- Información académica
  grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
  previous_school TEXT,
  has_special_needs BOOLEAN DEFAULT false,
  special_needs_description TEXT,
  
  -- Información adicional
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT, -- Notas adicionales del solicitante
  
  -- Estado y seguimiento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  application_date TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(user_id),
  rejection_reason TEXT,
  admin_notes TEXT, -- Notas internas del admin
  
  -- Año académico
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  
  -- Datos de creación
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: Un documento no puede tener solicitudes duplicadas pendientes
  CONSTRAINT unique_pending_application UNIQUE (student_document_number, academic_year_id, status)
);

-- 2. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_status ON enrollment_applications(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_academic_year ON enrollment_applications(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_grade_level ON enrollment_applications(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_application_date ON enrollment_applications(application_date);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_guardian_email ON enrollment_applications(guardian_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_applications_student_document ON enrollment_applications(student_document_number);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_enrollment_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_applications_updated_at ON enrollment_applications;
CREATE TRIGGER enrollment_applications_updated_at
  BEFORE UPDATE ON enrollment_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_applications_updated_at();

-- 4. Función para aprobar solicitud y crear estudiante
CREATE OR REPLACE FUNCTION approve_enrollment_application(
  p_application_id UUID,
  p_section_id UUID,
  p_approved_by UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  student_id UUID,
  guardian_id UUID,
  user_id UUID
) AS $$
DECLARE
  v_application RECORD;
  v_guardian_id UUID;
  v_student_id UUID;
  v_user_id UUID;
  v_student_code TEXT;
  v_temp_password TEXT;
BEGIN
  -- Obtener datos de la solicitud
  SELECT * INTO v_application
  FROM enrollment_applications
  WHERE id = p_application_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Solicitud no encontrada o ya procesada', NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar que la sección corresponde al grado solicitado
  IF NOT EXISTS (
    SELECT 1 FROM sections s
    WHERE s.id = p_section_id AND s.grade_level_id = v_application.grade_level_id
  ) THEN
    RETURN QUERY SELECT false, 'La sección no corresponde al grado solicitado', NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- 1. Crear o buscar apoderado
  SELECT id INTO v_guardian_id
  FROM guardians
  WHERE document_number = v_application.guardian_document_number
  LIMIT 1;
  
  IF v_guardian_id IS NULL THEN
    -- Crear usuario para el apoderado
    v_temp_password := 'Cermat' || v_application.guardian_document_number;
    
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
    VALUES (
      v_application.guardian_email,
      crypt(v_temp_password, gen_salt('bf')),
      now()
    )
    RETURNING id INTO v_user_id;
    
    -- Crear perfil
    INSERT INTO profiles (user_id, email, first_name, last_name, role)
    VALUES (
      v_user_id,
      v_application.guardian_email,
      v_application.guardian_first_name,
      v_application.guardian_last_name,
      'guardian'
    );
    
    -- Crear apoderado
    INSERT INTO guardians (
      user_id,
      first_name,
      last_name,
      document_type,
      document_number,
      phone,
      email,
      address,
      relationship
    ) VALUES (
      v_user_id,
      v_application.guardian_first_name,
      v_application.guardian_last_name,
      v_application.guardian_document_type,
      v_application.guardian_document_number,
      v_application.guardian_phone,
      v_application.guardian_email,
      v_application.guardian_address,
      v_application.guardian_relationship
    )
    RETURNING id INTO v_guardian_id;
  END IF;
  
  -- 2. Generar código de estudiante
  v_student_code := 'EST' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(student_code FROM 4) AS INTEGER)), 0) + 1
     FROM students
     WHERE student_code ~ '^EST[0-9]+$')::TEXT,
    6, '0'
  );
  
  -- 3. Crear estudiante
  INSERT INTO students (
    guardian_id,
    section_id,
    student_code,
    first_name,
    last_name,
    document_type,
    document_number,
    birth_date,
    gender,
    address,
    photo_url,
    emergency_contact_name,
    emergency_contact_phone,
    has_special_needs,
    special_needs_description,
    enrollment_date
  ) VALUES (
    v_guardian_id,
    p_section_id,
    v_student_code,
    v_application.student_first_name,
    v_application.student_last_name,
    v_application.student_document_type,
    v_application.student_document_number,
    v_application.student_birth_date,
    v_application.student_gender,
    v_application.student_address,
    v_application.student_photo_url,
    v_application.emergency_contact_name,
    v_application.emergency_contact_phone,
    v_application.has_special_needs,
    v_application.special_needs_description,
    now()
  )
  RETURNING id INTO v_student_id;
  
  -- 4. Actualizar solicitud
  UPDATE enrollment_applications
  SET
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = p_approved_by
  WHERE id = p_application_id;
  
  -- 5. Crear notificación para el apoderado (si tiene user_id)
  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      status
    ) VALUES (
      v_user_id,
      'matricula_aprobada',
      'Matrícula Aprobada',
      'La solicitud de matrícula para ' || v_application.student_first_name || ' ' || v_application.student_last_name || ' ha sido aprobada. Código: ' || v_student_code,
      'enrollment_application',
      p_application_id,
      'unread'
    );
  END IF;
  
  RETURN QUERY SELECT true, 'Matrícula aprobada exitosamente', v_student_id, v_guardian_id, v_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS Policies

-- Policy: Cualquier usuario puede crear solicitudes (público)
CREATE POLICY "public_can_create_applications"
ON enrollment_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Solo admin/director/secretary pueden ver todas las solicitudes
CREATE POLICY "staff_view_all_applications"
ON enrollment_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'secretary', 'coordinator')
  )
);

-- Policy: Apoderados pueden ver sus propias solicitudes
CREATE POLICY "guardians_view_own_applications"
ON enrollment_applications FOR SELECT
TO authenticated
USING (
  guardian_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
);

-- Policy: Solo admin/director/secretary pueden actualizar solicitudes
CREATE POLICY "staff_update_applications"
ON enrollment_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'secretary', 'coordinator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'secretary', 'coordinator')
  )
);

-- Policy: Solo admin/director pueden eliminar solicitudes
CREATE POLICY "admin_delete_applications"
ON enrollment_applications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'director')
  )
);

-- 6. Vista para estadísticas de solicitudes
CREATE OR REPLACE VIEW enrollment_application_stats AS
SELECT
  ay.year_name,
  gl.name AS grade_level,
  COUNT(*) AS total_applications,
  COUNT(*) FILTER (WHERE ea.status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE ea.status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE ea.status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE ea.status = 'cancelled') AS cancelled_count,
  ROUND(
    (COUNT(*) FILTER (WHERE ea.status = 'approved')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS approval_rate
FROM enrollment_applications ea
JOIN academic_years ay ON ay.id = ea.academic_year_id
JOIN grade_levels gl ON gl.id = ea.grade_level_id
GROUP BY ay.year_name, gl.name, gl.id
ORDER BY ay.year_name DESC, gl.id;

-- 7. Comentarios
COMMENT ON TABLE enrollment_applications IS 'Solicitudes de matrícula con flujo de aprobación';
COMMENT ON COLUMN enrollment_applications.status IS 'Estado: pending (pendiente), approved (aprobada), rejected (rechazada), cancelled (cancelada)';
COMMENT ON COLUMN enrollment_applications.guardian_relationship IS 'Relación: Padre, Madre, Tutor, Otro';
COMMENT ON FUNCTION approve_enrollment_application IS 'Aprueba una solicitud de matrícula y crea automáticamente el estudiante, apoderado y usuario';
COMMENT ON VIEW enrollment_application_stats IS 'Estadísticas de solicitudes de matrícula por año académico y grado';
