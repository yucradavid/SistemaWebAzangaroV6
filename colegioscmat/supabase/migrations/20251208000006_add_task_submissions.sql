-- =====================================================
-- MIGRACIÓN: Entregas de Tareas con Adjuntos
-- Fecha: 2025-12-08
-- Descripción: Tabla para entregas de estudiantes con archivos adjuntos
-- =====================================================

-- 1. Crear tabla task_submissions
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ DEFAULT now(),
  content TEXT, -- Texto de la entrega (opcional)
  attachment_url TEXT, -- URL del archivo en Supabase Storage
  attachment_name TEXT, -- Nombre original del archivo
  attachment_size INTEGER, -- Tamaño en bytes
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  grade DECIMAL(5,2), -- Calificación (0-20 o AD/A/B/C convertido a numérico)
  grade_letter TEXT CHECK (grade_letter IN ('AD', 'A', 'B', 'C', NULL)), -- Para primaria
  feedback TEXT, -- Retroalimentación del docente
  graded_by UUID REFERENCES profiles(user_id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: Un estudiante solo puede tener una entrega por tarea
  UNIQUE(assignment_id, student_id)
);

-- 2. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_task_submissions_assignment ON task_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student ON task_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_graded ON task_submissions(graded_at);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_task_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_submissions_updated_at ON task_submissions;
CREATE TRIGGER task_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_submissions_updated_at();

-- 4. RLS Policies

-- Policy: Estudiantes pueden ver sus propias entregas
CREATE POLICY "students_view_own_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Estudiantes pueden insertar sus propias entregas
CREATE POLICY "students_insert_own_submissions"
ON task_submissions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Estudiantes pueden actualizar sus propias entregas (solo antes de calificar)
CREATE POLICY "students_update_own_submissions"
ON task_submissions FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND status IN ('draft', 'submitted') -- No pueden editar si ya fue calificada
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Docentes pueden ver entregas de sus secciones asignadas
CREATE POLICY "teachers_view_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'director', 'coordinator')
  )
);

-- Policy: Docentes pueden actualizar entregas (calificar)
CREATE POLICY "teachers_update_submissions"
ON task_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'director', 'coordinator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'director', 'coordinator')
  )
);

-- Policy: Apoderados pueden ver entregas de sus hijos
CREATE POLICY "guardians_view_children_submissions"
ON task_submissions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN guardians g ON g.id = s.guardian_id
    WHERE g.user_id = auth.uid()
  )
);

-- 5. Función para notificar cuando se califica una tarea
CREATE OR REPLACE FUNCTION notify_task_graded()
RETURNS TRIGGER AS $$
DECLARE
  v_student_user_id UUID;
  v_assignment_title TEXT;
BEGIN
  -- Solo notificar si cambió de no calificada a calificada
  IF OLD.status != 'graded' AND NEW.status = 'graded' THEN
    -- Obtener user_id del estudiante
    SELECT user_id INTO v_student_user_id
    FROM students
    WHERE id = NEW.student_id;
    
    -- Obtener título de la tarea
    SELECT title INTO v_assignment_title
    FROM assignments
    WHERE id = NEW.assignment_id;
    
    -- Crear notificación
    IF v_student_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        status
      ) VALUES (
        v_student_user_id,
        'tarea_calificada',
        'Tarea calificada',
        'Tu tarea "' || v_assignment_title || '" ha sido calificada',
        'task_submission',
        NEW.id,
        'unread'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para notificaciones
DROP TRIGGER IF EXISTS notify_task_graded_trigger ON task_submissions;
CREATE TRIGGER notify_task_graded_trigger
  AFTER UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_graded();

-- 7. Vista para estadísticas de entregas por tarea
CREATE OR REPLACE VIEW assignment_submission_stats AS
SELECT
  a.id AS assignment_id,
  a.title,
  a.section_id,
  COUNT(DISTINCT s.id) AS total_students,
  COUNT(DISTINCT ts.id) AS total_submissions,
  COUNT(DISTINCT CASE WHEN ts.status = 'submitted' THEN ts.id END) AS pending_grade,
  COUNT(DISTINCT CASE WHEN ts.status = 'graded' THEN ts.id END) AS graded_count,
  ROUND(
    (COUNT(DISTINCT ts.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0)) * 100,
    2
  ) AS submission_percentage
FROM assignments a
LEFT JOIN students s ON s.section_id = a.section_id AND s.is_active = true
LEFT JOIN task_submissions ts ON ts.assignment_id = a.id AND ts.student_id = s.id
GROUP BY a.id, a.title, a.section_id;

-- 8. Comentarios
COMMENT ON TABLE task_submissions IS 'Entregas de tareas por estudiantes con adjuntos';
COMMENT ON COLUMN task_submissions.status IS 'Estado: draft (borrador), submitted (entregada), graded (calificada), returned (devuelta)';
COMMENT ON COLUMN task_submissions.grade IS 'Calificación numérica (0-20)';
COMMENT ON COLUMN task_submissions.grade_letter IS 'Calificación literal para primaria (AD/A/B/C)';
COMMENT ON COLUMN task_submissions.attachment_url IS 'URL del archivo en Supabase Storage (bucket: task-submissions)';
COMMENT ON VIEW assignment_submission_stats IS 'Estadísticas de entregas por tarea';

-- 9. Crear bucket en Storage (ejecutar desde código o Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', false);

-- 10. RLS Policies para Storage bucket 'task-submissions'
-- Estudiantes pueden subir archivos con su student_id en el path
CREATE POLICY "students_upload_own_submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-submissions'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Estudiantes pueden ver sus propios archivos
CREATE POLICY "students_view_own_submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Docentes pueden ver todos los archivos de entregas
CREATE POLICY "teachers_view_all_submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('teacher', 'admin', 'director', 'coordinator')
  )
);

-- Apoderados pueden ver archivos de sus hijos
CREATE POLICY "guardians_view_children_submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions'
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM students s
    JOIN guardians g ON g.id = s.guardian_id
    WHERE g.user_id = auth.uid()
  )
);
