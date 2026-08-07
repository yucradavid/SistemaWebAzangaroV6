<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reemplaza el limite hardcodeado (6) de validate_teacher_course_limit()
 * (definida originalmente en
 * colegioscmat/supabase/migrations/20251208000008_add_teacher_course_assignments.sql)
 * por una lectura desde system_settings.max_courses_per_teacher. El mensaje
 * de RAISE EXCEPTION cambia a un formato parseable
 * (LIMITE_CURSOS_DOCENTE:actual:max) para que el backend Laravel pueda
 * traducirlo a JSON estructurado en vez de propagar el texto crudo de
 * Postgres. La logica de conteo (COUNT DISTINCT course_id, activo, mismo
 * anio academico) no cambia.
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

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION validate_teacher_course_limit()
            RETURNS TRIGGER AS $$
            DECLARE
              current_course_count INTEGER;
              max_courses_per_teacher INTEGER := 6;
            BEGIN
              SELECT COUNT(DISTINCT course_id)
              INTO current_course_count
              FROM teacher_course_assignments
              WHERE teacher_id = NEW.teacher_id
                AND academic_year_id = NEW.academic_year_id
                AND is_active = TRUE
                AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

              IF current_course_count >= max_courses_per_teacher THEN
                RAISE EXCEPTION 'El docente ya tiene % cursos asignados. Máximo permitido: %',
                  current_course_count, max_courses_per_teacher;
              END IF;

              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL);
    }
};
