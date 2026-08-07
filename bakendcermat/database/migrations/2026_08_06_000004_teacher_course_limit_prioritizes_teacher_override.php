<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * validate_teacher_course_limit() ahora prioriza teachers.max_courses_override
 * (agregada en 2026_08_06_000003) sobre el limite global de system_settings.
 * Si el override es NULL, cae al comportamiento anterior (limite global).
 * La logica de conteo (COUNT DISTINCT course_id, activo, mismo anio academico)
 * no cambia.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
            RETURNS TRIGGER AS $$
            DECLARE
              current_course_count INTEGER;
              max_courses_per_teacher INTEGER;
              teacher_override INTEGER;
            BEGIN
              SELECT max_courses_override INTO teacher_override
              FROM teachers
              WHERE id = NEW.teacher_id;

              IF teacher_override IS NOT NULL THEN
                max_courses_per_teacher := teacher_override;
              ELSE
                SELECT COALESCE(value::INTEGER, 6)
                INTO max_courses_per_teacher
                FROM system_settings
                WHERE key = 'max_courses_per_teacher';

                IF max_courses_per_teacher IS NULL THEN
                  max_courses_per_teacher := 6;
                END IF;
              END IF;

              SELECT COUNT(DISTINCT course_id)
              INTO current_course_count
              FROM teacher_course_assignments
              WHERE teacher_id = NEW.teacher_id
                AND academic_year_id = NEW.academic_year_id
                AND is_active = TRUE
                AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

              IF current_course_count >= max_courses_per_teacher THEN
                RAISE EXCEPTION 'LIMITE_CURSOS_DOCENTE:%:%',
                  current_course_count, max_courses_per_teacher;
              END IF;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
            RETURNS TRIGGER AS $$
            DECLARE
              current_course_count INTEGER;
              max_courses_per_teacher INTEGER;
            BEGIN
              SELECT COALESCE(value::INTEGER, 6)
              INTO max_courses_per_teacher
              FROM system_settings
              WHERE key = 'max_courses_per_teacher';

              IF max_courses_per_teacher IS NULL THEN
                max_courses_per_teacher := 6;
              END IF;

              SELECT COUNT(DISTINCT course_id)
              INTO current_course_count
              FROM teacher_course_assignments
              WHERE teacher_id = NEW.teacher_id
                AND academic_year_id = NEW.academic_year_id
                AND is_active = TRUE
                AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

              IF current_course_count >= max_courses_per_teacher THEN
                RAISE EXCEPTION 'LIMITE_CURSOS_DOCENTE:%:%',
                  current_course_count, max_courses_per_teacher;
              END IF;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL);
    }
};
