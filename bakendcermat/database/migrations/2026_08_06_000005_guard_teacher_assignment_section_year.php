<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * sync_student_enrollments_on_teacher_assignment() copiaba NEW.section_id y
 * NEW.academic_year_id hacia student_course_enrollments sin validar que la
 * seccion referenciada perteneciera de verdad a ese academic_year_id. Un
 * INSERT/UPDATE de teacher_course_assignments con una seccion de otro anio
 * (posible porque el selector de seccion del frontend no filtraba por anio)
 * propagaba la inconsistencia a las matriculas generadas automaticamente.
 *
 * Esta migracion agrega la validacion ANTES de la logica original (que no
 * cambia) y aborta con un mensaje parseable por el backend Laravel.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION sync_student_enrollments_on_teacher_assignment()
            RETURNS TRIGGER AS $$
            DECLARE
              v_student RECORD;
              section_year_id UUID;
            BEGIN
              SELECT academic_year_id INTO section_year_id
              FROM sections WHERE id = NEW.section_id;

              IF section_year_id IS DISTINCT FROM NEW.academic_year_id THEN
                RAISE EXCEPTION 'SECCION_ANIO_INCONSISTENTE:%:%',
                  NEW.section_id, NEW.academic_year_id;
              END IF;

              IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN

                FOR v_student IN
                  SELECT id
                  FROM students
                  WHERE section_id = NEW.section_id
                    AND status = 'active'
                LOOP
                  INSERT INTO student_course_enrollments (
                    student_id,
                    course_id,
                    section_id,
                    academic_year_id,
                    status
                  ) VALUES (
                    v_student.id,
                    NEW.course_id,
                    NEW.section_id,
                    NEW.academic_year_id,
                    'active'
                  )
                  ON CONFLICT (student_id, course_id, academic_year_id)
                  DO UPDATE SET
                    status = 'active',
                    section_id = NEW.section_id,
                    enrollment_date = NOW();
                END LOOP;
              END IF;

              IF NEW.is_active = FALSE AND (OLD IS NULL OR OLD.is_active = TRUE) THEN
                UPDATE student_course_enrollments
                SET status = 'dropped'
                WHERE course_id = NEW.course_id
                  AND section_id = NEW.section_id
                  AND academic_year_id = NEW.academic_year_id
                  AND status = 'active';
              END IF;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION sync_student_enrollments_on_teacher_assignment()
            RETURNS TRIGGER AS $$
            DECLARE
              v_student RECORD;
            BEGIN
              IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN

                FOR v_student IN
                  SELECT id
                  FROM students
                  WHERE section_id = NEW.section_id
                    AND status = 'active'
                LOOP
                  INSERT INTO student_course_enrollments (
                    student_id,
                    course_id,
                    section_id,
                    academic_year_id,
                    status
                  ) VALUES (
                    v_student.id,
                    NEW.course_id,
                    NEW.section_id,
                    NEW.academic_year_id,
                    'active'
                  )
                  ON CONFLICT (student_id, course_id, academic_year_id)
                  DO UPDATE SET
                    status = 'active',
                    section_id = NEW.section_id,
                    enrollment_date = NOW();
                END LOOP;
              END IF;

              IF NEW.is_active = FALSE AND (OLD IS NULL OR OLD.is_active = TRUE) THEN
                UPDATE student_course_enrollments
                SET status = 'dropped'
                WHERE course_id = NEW.course_id
                  AND section_id = NEW.section_id
                  AND academic_year_id = NEW.academic_year_id
                  AND status = 'active';
              END IF;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL);
    }
};
