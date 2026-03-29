-- =====================================================
-- MÓDULO DE HORARIOS
-- Creación de tabla course_schedules y campo color en courses
-- =====================================================

-- 1. Agregar campo de color a la tabla courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#1D4ED8';

-- Actualizar colores para cursos existentes (opcional, valores por defecto)
UPDATE courses SET color = '#1D4ED8' WHERE color IS NULL;

-- 2. Crear tabla de horarios
CREATE TABLE IF NOT EXISTS course_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Validación: end_time debe ser mayor que start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_schedules_section ON course_schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON course_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course ON course_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON course_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_year ON course_schedules(academic_year_id);

-- Índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_schedules_section_day 
ON course_schedules(section_id, day_of_week, start_time);

-- Habilitar RLS
ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA course_schedules
-- =====================================================

-- Política: Admin, Director, Coordinator pueden ver todos los horarios
CREATE POLICY "Admin roles can view all schedules"
ON course_schedules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'coordinator', 'secretary')
  )
);

-- Política: Docentes pueden ver sus propios horarios
CREATE POLICY "Teachers can view their schedules"
ON course_schedules FOR SELECT
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Política: Estudiantes pueden ver el horario de su sección
CREATE POLICY "Students can view their section schedules"
ON course_schedules FOR SELECT
TO authenticated
USING (
  section_id IN (
    SELECT section_id FROM students 
    WHERE user_id = auth.uid() AND section_id IS NOT NULL
  )
);

-- Política: Apoderados pueden ver horarios de las secciones de sus hijos
CREATE POLICY "Guardians can view their children schedules"
ON course_schedules FOR SELECT
TO authenticated
USING (
  section_id IN (
    SELECT s.section_id 
    FROM students s
    INNER JOIN student_guardians sg ON s.id = sg.student_id
    INNER JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND s.section_id IS NOT NULL
  )
);

-- Política: Admin, Director, Coordinator pueden crear/editar horarios
CREATE POLICY "Admin roles can manage schedules"
ON course_schedules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'coordinator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'coordinator')
  )
);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_course_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_schedules_updated_at
    BEFORE UPDATE ON course_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_course_schedules_updated_at();

-- =====================================================
-- FUNCIÓN AUXILIAR: Verificar solapamiento de horarios
-- =====================================================

CREATE OR REPLACE FUNCTION check_schedule_overlap(
    p_section_id UUID,
    p_day_of_week INTEGER,
    p_start_time TIME,
    p_end_time TIME,
    p_schedule_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO overlap_count
    FROM course_schedules
    WHERE section_id = p_section_id
    AND day_of_week = p_day_of_week
    AND (p_schedule_id IS NULL OR id != p_schedule_id)
    AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
    );
    
    RETURN overlap_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE course_schedules IS 'Horarios de clases por sección, curso y docente';
COMMENT ON COLUMN course_schedules.day_of_week IS '1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo';
COMMENT ON COLUMN course_schedules.room_number IS 'Número o nombre del aula/salón';
COMMENT ON COLUMN courses.color IS 'Color hexadecimal para identificación visual del curso (#RRGGBB)';
