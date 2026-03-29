-- =====================================================
-- FIX: Create Messages Table
-- Copy and paste this entire file into Supabase SQL Editor
-- Date: 2025-12-09
-- =====================================================

-- Crear tabla de mensajes para comunicación Docente ↔ Apoderado
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('teacher', 'guardian')),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Docentes ven mensajes de sus estudiantes, apoderados ven mensajes de sus hijos
CREATE POLICY "Teachers and guardians can read relevant messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    -- Docente puede ver mensajes relacionados a sus estudiantes
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN teacher_course_assignments tca ON tca.teacher_id = t.id
      JOIN students s ON s.section_id = tca.section_id
      WHERE t.user_id = auth.uid() AND s.id = messages.student_id
    ) OR
    -- Apoderado puede ver mensajes relacionados a sus hijos
    EXISTS (
      SELECT 1 FROM guardians g
      JOIN student_guardians sg ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid() AND sg.student_id = messages.student_id
    ) OR
    -- Sender puede ver sus propios mensajes
    sender_id = auth.uid() OR
    -- Admin puede ver todos
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'director')
    )
  );

-- Política de escritura: Docentes y apoderados pueden enviar mensajes
CREATE POLICY "Teachers and guardians can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      -- Docente puede enviar mensajes sobre sus estudiantes
      (sender_role = 'teacher' AND EXISTS (
        SELECT 1 FROM teachers t
        JOIN teacher_course_assignments tca ON tca.teacher_id = t.id
        JOIN students s ON s.section_id = tca.section_id
        WHERE t.user_id = auth.uid() AND s.id = messages.student_id
      )) OR
      -- Apoderado puede enviar mensajes sobre sus hijos
      (sender_role = 'guardian' AND EXISTS (
        SELECT 1 FROM guardians g
        JOIN student_guardians sg ON sg.guardian_id = g.id
        WHERE g.user_id = auth.uid() AND sg.student_id = messages.student_id
      ))
    )
  );

-- Política de actualización: Solo para marcar como leído
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN teacher_course_assignments tca ON tca.teacher_id = t.id
      JOIN students s ON s.section_id = tca.section_id
      WHERE t.user_id = auth.uid() AND s.id = messages.student_id
    ) OR
    EXISTS (
      SELECT 1 FROM guardians g
      JOIN student_guardians sg ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid() AND sg.student_id = messages.student_id
    )
  );

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_student_id ON messages(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;
