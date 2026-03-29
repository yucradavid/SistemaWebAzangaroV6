/*
  # Notifications and Audit Logs

  ## New Tables
  - `notifications` - Sistema de notificaciones para usuarios
  - `audit_logs` - Registro de auditoría para eventos críticos

  ## Features
  - Notificaciones para eventos académicos y financieros
  - Auditoría de cambios en evaluaciones, pagos y comunicados
  - Trazabilidad completa de operaciones críticas
*/

-- =====================================================
-- TABLA: NOTIFICATIONS
-- =====================================================

CREATE TYPE notification_type AS ENUM (
  'evaluacion_publicada',
  'justificacion_aprobada',
  'justificacion_rechazada',
  'pago_registrado',
  'comunicado_nuevo',
  'tarea_nueva',
  'recordatorio_pago'
);

CREATE TYPE notification_status AS ENUM ('no_leida', 'leida');

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status notification_status DEFAULT 'no_leida',
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status) WHERE status = 'no_leida';
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TABLA: AUDIT_LOGS
-- =====================================================

CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete', 'publish', 'approve', 'reject', 'close');

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- RLS Policies
CREATE POLICY "Admin can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para crear notificación
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear log de auditoría
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_action audit_action,
  p_entity_type text,
  p_entity_id uuid,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    reason
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_reason
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS DE EJEMPLO (Evaluaciones)
-- =====================================================

-- Trigger para auditar cambios en evaluaciones
CREATE OR REPLACE FUNCTION audit_evaluation_changes()
RETURNS TRIGGER AS $$
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
        -- Notificar al estudiante
        PERFORM create_notification(
          (SELECT user_id FROM students WHERE id = NEW.student_id),
          'evaluacion_publicada'::notification_type,
          'Nueva calificación publicada',
          'Se ha publicado una nueva calificación en ' || (SELECT name FROM courses WHERE id = NEW.course_id),
          'evaluation',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_evaluations
  AFTER UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION audit_evaluation_changes();

-- =====================================================
-- TRIGGER PARA JUSTIFICACIONES
-- =====================================================

CREATE OR REPLACE FUNCTION notify_justification_status()
RETURNS TRIGGER AS $$
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
    
    -- Notificar al apoderado
    IF NEW.status IN ('aprobada', 'rechazada') AND NEW.guardian_id IS NOT NULL THEN
      PERFORM create_notification(
        (SELECT user_id FROM guardians WHERE id = NEW.guardian_id),
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_justifications
  AFTER UPDATE ON attendance_justifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_justification_status();

-- =====================================================
-- TRIGGER PARA PAGOS
-- =====================================================

CREATE OR REPLACE FUNCTION audit_and_notify_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id uuid;
  v_guardian_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auditar el pago
    PERFORM create_audit_log(
      NEW.received_by,
      'insert'::audit_action,
      'payment',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      NEW.notes
    );
    
    -- Obtener student_id y notificar al apoderado
    v_student_id := NEW.student_id;
    
    -- Buscar apoderado principal
    SELECT g.user_id INTO v_guardian_user_id
    FROM student_guardians sg
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE sg.student_id = v_student_id AND sg.is_primary = true
    LIMIT 1;
    
    IF v_guardian_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_guardian_user_id,
        'pago_registrado'::notification_type,
        'Pago registrado exitosamente',
        'Se ha registrado un pago de S/ ' || NEW.amount::text,
        'payment',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_payments
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_and_notify_payment();
