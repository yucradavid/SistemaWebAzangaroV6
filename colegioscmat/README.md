# Cermat School - Plataforma Escolar Integral

**"Educación clara, gestión simple y pagos al día"**

Plataforma escolar completa para Cermat School en Azángaro, Perú, que unifica gestión académica, financiera y comunicación entre la comunidad educativa.

## Características principales

### 🌐 Sitio Público
- Landing page institucional con información sobre misión, visión y valores
- Información de niveles educativos (Inicial, Primaria, Secundaria)
- Proceso de admisión 2025
- Formulario de contacto

### 🎓 Portal Académico
- **Asistencia**: Registro diario por curso con estados (Presente/Tarde/Falta/Justificado)
- **Evaluaciones**: Sistema de calificaciones AD/A/B/C según competencias
- **Tareas**: Creación, asignación y seguimiento de entregas
- **Comunicados**: Publicación de anuncios para diferentes audiencias

### 💰 Sistema Financiero
- **Estado de cuenta**: Vista de cargos y pagos por estudiante
- **Emisión de cargos**: Generación masiva de pensiones y otros conceptos
- **Caja**: Registro de pagos y cierre diario
- **Reportes**: Aging de saldos, conciliación y recaudación

### 📊 Reportes y SIAGIE
- Consolidados académicos por curso, grado y período
- Reportes de asistencia
- Exportación compatible con SIAGIE
- Análisis financiero

## Roles de usuario

- **Admin/Director**: Acceso completo a todos los módulos
- **Coordinador**: Gestión académica y reportes
- **Secretaría**: Gestión administrativa
- **Docente**: Asistencia, evaluaciones y tareas
- **Estudiante**: Consulta de notas, tareas y asistencia
- **Apoderado**: Seguimiento de hijos y pagos
- **Finanzas**: Gestión financiera completa
- **Cajero**: Registro de pagos y cierre de caja

## Tecnologías utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS con sistema de diseño personalizado
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Iconos**: Lucide React

## Identidad visual

### Colores principales
- **Azul principal**: #0E3A8A (700)
- **Azul alterno**: #1D4ED8 (600)
- **Rojo acento**: #C81E1E (600)
- **Rojo alterno**: #EF4444 (500)
- **Blanco base**: #FFFFFF

### Degradados
- **Héroe principal**: `linear-gradient(135deg, #0E3A8A 0%, #1D4ED8 40%, #C81E1E 100%)`
- **Botones primarios**: Degradado azul → rojo
- **Cards de nivel**: Degradados específicos por nivel educativo

### Tipografía
- **Fuente**: Inter/Poppins
- **Titulares**: 700/600 weight
- **Texto**: 400/500 weight

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno en `.env`:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

3. La base de datos ya está configurada con todas las tablas y políticas RLS necesarias.

## Estructura de la base de datos

### Tablas principales
- `profiles` - Perfiles de usuario con roles
- `academic_years` - Años escolares
- `periods` - Períodos académicos (bimestres)
- `grade_levels` - Niveles educativos
- `sections` - Secciones (grado + letra)
- `courses` - Cursos/asignaturas
- `competencies` - Competencias por curso
- `students` - Estudiantes
- `guardians` - Apoderados
- `teachers` - Docentes
- `attendance` - Asistencias
- `evaluations` - Calificaciones
- `assignments` - Tareas
- `announcements` - Comunicados
- `charges` - Cargos financieros
- `payments` - Pagos
- `receipts` - Comprobantes

### Seguridad
- Row Level Security (RLS) habilitado en todas las tablas
- Políticas restrictivas por defecto
- Verificación de autenticación y pertenencia
- Aislamiento de datos por rol

## Flujos de usuario

### Docente → Publicar notas
1. Dashboard → Seleccionar curso
2. Evaluación → Período + Competencia
3. Editar planilla (AD/A/B/C)
4. Guardar borrador → Publicar (familias ven)

### Apoderado → Ver notas y pagar
1. Dashboard → Seleccionar hijo
2. Ver calificaciones o estado de cuenta
3. Seleccionar cargos → Pagar ahora
4. Descargar comprobante

### Estudiante → Entregar tarea
1. Dashboard → Tareas pendientes
2. Abrir tarea → Adjuntar archivo
3. Entregar → Ver feedback del docente

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Licencia

© 2025 Cermat School. Todos los derechos reservados.

---

**Contacto**
Cermat School - Azángaro, Perú
Email: informes@cermatschool.edu.pe
Teléfono: +51 951 234 567
