-- =====================================================
-- CORRECCIÓN URGENTE: Fix triggers de notificaciones
-- Ejecutar esto AHORA en Supabase SQL Editor
-- =====================================================
-- Problema: Los triggers intentan crear notificaciones 
-- pero user_id es NULL en algunos casos
-- =====================================================

-- 1. FIX: Trigger de evaluaciones
CREATE OR REPLACE FUNCTION audit_evaluation_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_student_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Solo auditar si cambió el grado o el estado
    IF OLD.grade IS DISTINCT FROM NEW.grade OR OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM create_audit_log(
        NEW.recorded_by,
        'update'::audit_action,
        'evaluation',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        NULL
      );
      
      -- Si se publicó, notificar al estudiante y apoderados
      IF OLD.status = 'borrador' AND NEW.status = 'publicada' THEN
        -- Obtener user_id del estudiante de forma segura
        SELECT user_id INTO v_student_user_id
        FROM students
        WHERE id = NEW.student_id;
        
        -- Solo crear notificación si el estudiante tiene user_id
        IF v_student_user_id IS NOT NULL THEN
          PERFORM create_notification(
            v_student_user_id,
            'evaluacion_publicada'::notification_type,
            'Nueva calificación publicada',
            'Se ha publicado una nueva calificación en ' || (SELECT name FROM courses WHERE id = NEW.course_id),
            'evaluation',
            NEW.id
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX: Trigger de justificaciones
CREATE OR REPLACE FUNCTION notify_justification_status()
RETURNS TRIGGER AS $$
DECLARE
  v_guardian_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Auditar el cambio
    PERFORM create_audit_log(
      NEW.reviewed_by,
      CASE 
        WHEN NEW.status = 'aprobada' THEN 'approve'::audit_action
        WHEN NEW.status = 'rechazada' THEN 'reject'::audit_action
        ELSE 'update'::audit_action
      END,
      'attendance_justification',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.review_notes
    );
    
    -- Notificar al apoderado solo si tiene user_id
    IF NEW.status IN ('aprobada', 'rechazada') AND NEW.guardian_id IS NOT NULL THEN
      SELECT user_id INTO v_guardian_user_id
      FROM guardians
      WHERE id = NEW.guardian_id;
      
      IF v_guardian_user_id IS NOT NULL THEN
        PERFORM create_notification(
          v_guardian_user_id,
          CASE 
            WHEN NEW.status = 'aprobada' THEN 'justificacion_aprobada'::notification_type
            ELSE 'justificacion_rechazada'::notification_type
          END,
          'Justificación ' || NEW.status,
          'Su justificación de inasistencia ha sido ' || NEW.status,
          'justification',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificación
SELECT 'Triggers actualizados correctamente ✅' as status;
