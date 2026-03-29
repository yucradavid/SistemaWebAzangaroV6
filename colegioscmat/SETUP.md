# Guía de Configuración - Cermat School

Esta guía te ayudará a configurar la plataforma Cermat School desde cero.

## Paso 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales (URL y ANON KEY)

### 1.2 Aplicar migraciones
Las migraciones ya se aplicaron automáticamente al proyecto. La base de datos incluye:
- ✅ Tablas de usuarios, estudiantes, docentes, apoderados
- ✅ Tablas académicas (cursos, asistencia, evaluaciones, tareas)
- ✅ Tablas financieras (cargos, pagos, recibos)
- ✅ Políticas RLS para seguridad por roles

### 1.3 Configurar variables de entorno
Actualiza el archivo `.env` con tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Paso 2: Crear datos iniciales

### 2.1 Año académico
Ejecuta en el SQL Editor de Supabase:

```sql
INSERT INTO academic_years (year, start_date, end_date, is_active)
VALUES (2025, '2025-03-01', '2025-12-20', true);
```

### 2.2 Períodos académicos
```sql
INSERT INTO periods (academic_year_id, name, period_number, start_date, end_date)
SELECT
  id,
  unnest(ARRAY['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV']),
  unnest(ARRAY[1, 2, 3, 4]),
  unnest(ARRAY['2025-03-01'::date, '2025-05-15'::date, '2025-08-01'::date, '2025-10-15'::date]),
  unnest(ARRAY['2025-05-10'::date, '2025-07-30'::date, '2025-10-10'::date, '2025-12-20'::date])
FROM academic_years
WHERE year = 2025;
```

### 2.3 Niveles educativos
```sql
INSERT INTO grade_levels (level, grade, name) VALUES
-- Inicial
('inicial', 3, '3 años'),
('inicial', 4, '4 años'),
('inicial', 5, '5 años'),
-- Primaria
('primaria', 1, '1ro Primaria'),
('primaria', 2, '2do Primaria'),
('primaria', 3, '3ro Primaria'),
('primaria', 4, '4to Primaria'),
('primaria', 5, '5to Primaria'),
('primaria', 6, '6to Primaria'),
-- Secundaria
('secundaria', 1, '1ro Secundaria'),
('secundaria', 2, '2do Secundaria'),
('secundaria', 3, '3ro Secundaria'),
('secundaria', 4, '4to Secundaria'),
('secundaria', 5, '5to Secundaria');
```

### 2.4 Secciones (ejemplo para 5to Primaria)
```sql
INSERT INTO sections (academic_year_id, grade_level_id, section_letter)
SELECT
  ay.id,
  gl.id,
  unnest(ARRAY['A', 'B'])
FROM academic_years ay, grade_levels gl
WHERE ay.year = 2025 AND gl.level = 'primaria' AND gl.grade = 5;
```

## Paso 3: Crear usuarios de prueba

### 3.1 Usuario Administrador
1. Ve a Authentication → Users en Supabase
2. Crea un usuario: `admin@cermatschool.edu.pe`
3. Ejecuta en SQL Editor:

```sql
INSERT INTO profiles (id, role, full_name, email, is_active)
VALUES (
  'UUID_DEL_USUARIO',
  'admin',
  'Director General',
  'admin@cermatschool.edu.pe',
  true
);
```

### 3.2 Usuario Docente
```sql
-- Crear usuario en Authentication primero
INSERT INTO profiles (id, role, full_name, email, is_active)
VALUES (
  'UUID_DEL_USUARIO',
  'teacher',
  'Prof. Juan Pérez',
  'jperez@cermatschool.edu.pe',
  true
);

INSERT INTO teachers (user_id, teacher_code, first_name, last_name, email, specialization)
VALUES (
  'UUID_DEL_USUARIO',
  'DOC-001',
  'Juan',
  'Pérez Mamani',
  'jperez@cermatschool.edu.pe',
  'Matemática'
);
```

### 3.3 Usuario Apoderado
```sql
-- Crear usuario en Authentication primero
INSERT INTO profiles (id, role, full_name, email, is_active)
VALUES (
  'UUID_DEL_USUARIO',
  'guardian',
  'María García',
  'mgarcia@email.com',
  true
);

INSERT INTO guardians (user_id, first_name, last_name, phone, email, relationship)
VALUES (
  'UUID_DEL_USUARIO',
  'María',
  'García López',
  '+51951234567',
  'mgarcia@email.com',
  'Madre'
);
```

### 3.4 Usuario Estudiante
```sql
-- Crear usuario en Authentication primero
INSERT INTO profiles (id, role, full_name, email, is_active)
VALUES (
  'UUID_DEL_USUARIO',
  'student',
  'Ana Quispe',
  'aquispe@cermatschool.edu.pe',
  true
);

INSERT INTO students (user_id, student_code, first_name, last_name, section_id)
SELECT
  'UUID_DEL_USUARIO',
  'EST-2025-001',
  'Ana',
  'Quispe Huanca',
  s.id
FROM sections s
JOIN grade_levels gl ON s.grade_level_id = gl.id
JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE ay.year = 2025 AND gl.level = 'primaria' AND gl.grade = 5 AND s.section_letter = 'A';
```

## Paso 4: Ejecutar la aplicación

```bash
npm install
npm run dev
```

## Credenciales de prueba

Una vez creados los usuarios, podrás iniciar sesión con:

- **Admin**: admin@cermatschool.edu.pe / [contraseña configurada]
- **Docente**: jperez@cermatschool.edu.pe / [contraseña configurada]
- **Apoderado**: mgarcia@email.com / [contraseña configurada]
- **Estudiante**: aquispe@cermatschool.edu.pe / [contraseña configurada]

## Próximos pasos

1. Crear más cursos y asignaturas
2. Asignar docentes a cursos
3. Vincular apoderados con estudiantes
4. Crear cargos financieros (pensiones)
5. Probar flujos de asistencia y evaluaciones

## Soporte

Para ayuda adicional, contacta:
- Email: soporte@cermatschool.edu.pe
- Teléfono: +51 951 234 567
