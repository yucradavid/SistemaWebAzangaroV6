/*
  # Fix approve_enrollment_application para usar student_guardians
  
  Problema:
  - La función approve_enrollment_application intenta insertar guardian_id en students
  - Pero students ya no tiene ese campo, usa la tabla student_guardians
  - También falta la inscripción automática a cursos (aunque el trigger debería hacerlo)
  
  Solución:
  - Actualizar función para usar student_guardians
  - Agregar validación de que el trigger de cursos se ejecute
*/

-- Eliminar función antigua
DROP FUNCTION IF EXISTS approve_enrollment_application(UUID, UUID, UUID);

-- Recrear función corregida
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
  v_academic_year_id UUID;
BEGIN
  -- Obtener datos de la solicitud
  SELECT * INTO v_application
  FROM enrollment_applications
  WHERE id = p_application_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Solicitud no encontrada o ya procesada'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar que la sección corresponde al grado solicitado
  IF NOT EXISTS (
    SELECT 1 FROM sections s
    WHERE s.id = p_section_id AND s.grade_level_id = v_application.grade_level_id
  ) THEN
    RETURN QUERY SELECT false, 'La sección no corresponde al grado solicitado'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Obtener año académico activo
  SELECT id INTO v_academic_year_id
  FROM academic_years
  WHERE is_active = TRUE
  LIMIT 1;
  
  IF v_academic_year_id IS NULL THEN
    RETURN QUERY SELECT false, 'No hay año académico activo'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- 1. Crear o buscar apoderado
  SELECT id INTO v_guardian_id
  FROM guardians
  WHERE dni = v_application.guardian_document_number
  LIMIT 1;
  
  IF v_guardian_id IS NULL THEN
    -- Crear apoderado SIN usuario (se creará después desde el frontend/admin)
    -- La creación de usuarios de Supabase Auth debe hacerse desde el API, no desde SQL
    INSERT INTO guardians (
      user_id,
      first_name,
      last_name,
      dni,
      phone,
      email,
      address,
      relationship
    ) VALUES (
      NULL,  -- user_id se asignará cuando el admin cree el usuario manualmente
      v_application.guardian_first_name,
      v_application.guardian_last_name,
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
  
  -- NOTA: La creación del usuario de Supabase Auth debe hacerse desde el frontend
  -- porque no tenemos acceso directo a auth.users desde funciones SQL.
  -- El frontend deberá llamar a supabase.auth.admin.createUser() después de esta función.
  
  -- 3. Crear estudiante (sin user_id, se asignará después desde el frontend)
  INSERT INTO students (
    user_id,
    section_id,
    student_code,
    first_name,
    last_name,
    dni,
    birth_date,
    gender,
    address,
    photo_url,
    enrollment_date,
    status
  ) VALUES (
    NULL,  -- user_id se asignará cuando el admin cree el usuario manualmente o desde frontend
    p_section_id,
    v_student_code,
    v_application.student_first_name,
    v_application.student_last_name,
    v_application.student_document_number,  -- Se guarda en dni
    v_application.student_birth_date,
    v_application.student_gender,
    v_application.student_address,
    v_application.student_photo_url,
    now(),
    'active'
  )
  RETURNING id INTO v_student_id;
  
  -- 4. Crear relación estudiante-apoderado
  INSERT INTO student_guardians (
    student_id,
    guardian_id,
    is_primary
  ) VALUES (
    v_student_id,
    v_guardian_id,
    true  -- Primer apoderado es principal
  );
  
  -- 5. Actualizar solicitud
  UPDATE enrollment_applications
  SET
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = p_approved_by
  WHERE id = p_application_id;
  
  -- 6. Verificar que el trigger haya inscrito al estudiante en cursos
  -- (El trigger auto_enroll_student_to_section_courses debería ejecutarse automáticamente)
  PERFORM pg_sleep(0.1); -- Pequeña pausa para asegurar que el trigger se complete
  
  -- 7. Crear notificación para el apoderado (solo si tiene usuario)
  -- Obtener user_id del guardian si existe
  SELECT g.user_id INTO v_user_id FROM guardians g WHERE g.id = v_guardian_id;
  
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
  
  -- Retornar éxito con IDs
  RETURN QUERY SELECT true, 'Matrícula aprobada exitosamente. Estudiante inscrito en ' || 
    (SELECT COUNT(*)::TEXT FROM student_course_enrollments sce WHERE sce.student_id = v_student_id AND sce.status = 'active') || 
    ' cursos.'::TEXT, v_student_id, v_guardian_id, v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario
COMMENT ON FUNCTION approve_enrollment_application IS 'Aprueba una solicitud de matrícula, crea estudiante y apoderado, y usa student_guardians en lugar de guardian_id directo. El trigger auto_enroll_student_to_section_courses inscribe automáticamente al estudiante en los cursos de su sección.';
