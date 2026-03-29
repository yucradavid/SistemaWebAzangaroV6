/*
  # Add Attendance Justifications

  ## New Tables
  - `attendance_justifications` - Justification requests for absences/tardiness
  
  ## Features
  - Guardian can submit justification with reason and optional attachment
  - Admin/Director/Secretary can approve/reject with notes
  - Tracks status: pending, approved, rejected
*/

CREATE TYPE justification_status AS ENUM ('pendiente', 'aprobada', 'rechazada');

CREATE TABLE IF NOT EXISTS attendance_justifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id uuid NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES guardians(id) ON DELETE SET NULL,
  reason text NOT NULL,
  attachment_url text,
  status justification_status DEFAULT 'pendiente',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attendance_id)
);

ALTER TABLE attendance_justifications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_justifications_status ON attendance_justifications(status);
CREATE INDEX IF NOT EXISTS idx_justifications_student ON attendance_justifications(student_id);
CREATE INDEX IF NOT EXISTS idx_justifications_attendance ON attendance_justifications(attendance_id);

-- RLS Policies
CREATE POLICY "Guardians can read their students' justifications"
  ON attendance_justifications FOR SELECT
  TO authenticated
  USING (
    guardian_id IN (
      SELECT id FROM guardians WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'secretary', 'coordinator')
    )
  );

CREATE POLICY "Guardians can insert justifications for their students"
  ON attendance_justifications FOR INSERT
  TO authenticated
  WITH CHECK (
    guardian_id IN (
      SELECT id FROM guardians WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Guardians can update pending justifications"
  ON attendance_justifications FOR UPDATE
  TO authenticated
  USING (
    (guardian_id IN (
      SELECT id FROM guardians WHERE user_id = auth.uid()
    ) AND status = 'pendiente') OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'secretary')
    )
  );

CREATE POLICY "Admin roles can manage all justifications"
  ON attendance_justifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'secretary')
    )
  );
