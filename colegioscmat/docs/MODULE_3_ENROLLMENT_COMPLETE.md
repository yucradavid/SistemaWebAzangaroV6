# Módulo 3: Sistema de Matrícula con Aprobación - Documentación Completa

**Estado**: ✅ COMPLETO (Componentes implementados - Pendiente testing)  
**Fecha**: 8 de diciembre de 2024  
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

El Módulo 3 implementa un **sistema completo de gestión de matrículas** que permite a familias solicitar matrícula en línea y al personal administrativo revisar, aprobar o rechazar solicitudes de forma eficiente. Al aprobar una solicitud, el sistema automáticamente crea el estudiante, apoderado y cuenta de usuario en una sola transacción.

### Características Principales

- ✅ Formulario público de solicitud de matrícula (sin autenticación)
- ✅ Validación de datos del estudiante y apoderado
- ✅ Panel de aprobación para personal administrativo
- ✅ Aprobación automatizada con creación de registros
- ✅ Rechazo con motivo y notificación
- ✅ Generación automática de códigos de estudiante
- ✅ Soporte para necesidades educativas especiales
- ✅ Contacto de emergencia
- ✅ Vista de estadísticas de solicitudes

---

## 🗄️ Arquitectura de Base de Datos

### Tabla: `enrollment_applications`

```sql
CREATE TABLE enrollment_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  
  -- Datos del Estudiante
  student_first_name VARCHAR(100) NOT NULL,
  student_last_name VARCHAR(100) NOT NULL,
  student_document_type VARCHAR(20) NOT NULL,
  student_document_number VARCHAR(50) NOT NULL,
  student_birth_date DATE NOT NULL,
  student_gender CHAR(1) NOT NULL CHECK (student_gender IN ('M', 'F')),
  student_address TEXT,
  student_photo_url TEXT,
  
  -- Datos del Apoderado
  guardian_first_name VARCHAR(100) NOT NULL,
  guardian_last_name VARCHAR(100) NOT NULL,
  guardian_document_type VARCHAR(20) NOT NULL,
  guardian_document_number VARCHAR(50) NOT NULL,
  guardian_phone VARCHAR(20) NOT NULL,
  guardian_email VARCHAR(100) NOT NULL,
  guardian_address TEXT,
  guardian_relationship VARCHAR(50) NOT NULL,
  
  -- Información Académica
  grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
  previous_school VARCHAR(200),
  has_special_needs BOOLEAN DEFAULT FALSE,
  special_needs_description TEXT,
  
  -- Contacto de Emergencia
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  
  -- Estado de la Solicitud
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  
  -- Notas
  notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Índices

```sql
CREATE INDEX idx_enrollment_applications_status ON enrollment_applications(status);
CREATE INDEX idx_enrollment_applications_academic_year ON enrollment_applications(academic_year_id);
CREATE INDEX idx_enrollment_applications_grade_level ON enrollment_applications(grade_level_id);
CREATE INDEX idx_enrollment_applications_application_date ON enrollment_applications(application_date);
CREATE INDEX idx_enrollment_applications_guardian_email ON enrollment_applications(guardian_email);
CREATE INDEX idx_enrollment_applications_student_document ON enrollment_applications(student_document_number);
```

### Vista de Estadísticas

```sql
CREATE OR REPLACE VIEW enrollment_application_stats AS
SELECT
  ea.academic_year_id,
  gl.name AS grade_level_name,
  gl.level_type,
  COUNT(*) AS total_applications,
  COUNT(*) FILTER (WHERE ea.status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE ea.status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE ea.status = 'rejected') AS rejected_count,
  ROUND(
    COUNT(*) FILTER (WHERE ea.status = 'approved')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE ea.status IN ('approved', 'rejected')), 0) * 100,
    2
  ) AS approval_rate
FROM enrollment_applications ea
JOIN grade_levels gl ON ea.grade_level_id = gl.id
GROUP BY ea.academic_year_id, gl.id, gl.name, gl.level_type;
```

---

## 🔐 Row Level Security (RLS)

### Políticas Implementadas

```sql
-- 1. Cualquier persona puede crear solicitudes (público)
CREATE POLICY "public_can_create_applications"
ON enrollment_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Staff puede ver todas las solicitudes
CREATE POLICY "staff_view_all_applications"
ON enrollment_applications
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role IN ('admin', 'director', 'secretary', 'coordinator')
  )
);

-- 3. Apoderados pueden ver sus propias solicitudes
CREATE POLICY "guardians_view_own_applications"
ON enrollment_applications
FOR SELECT
TO authenticated
USING (guardian_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- 4. Staff puede actualizar solicitudes
CREATE POLICY "staff_update_applications"
ON enrollment_applications
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role IN ('admin', 'director', 'secretary', 'coordinator')
  )
);

-- 5. Solo admin/director pueden eliminar
CREATE POLICY "admin_delete_applications"
ON enrollment_applications
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'director')
  )
);
```

---

## ⚙️ Función de Aprobación Automática

### `approve_enrollment_application()`

Esta función realiza todo el proceso de matrícula en una sola transacción:

```sql
CREATE OR REPLACE FUNCTION approve_enrollment_application(
  application_id UUID,
  section_id UUID,
  approved_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_application enrollment_applications%ROWTYPE;
  v_section sections%ROWTYPE;
  v_guardian_id UUID;
  v_student_id UUID;
  v_student_code TEXT;
  v_temp_password TEXT;
  v_guardian_user_id UUID;
  v_max_code INTEGER;
BEGIN
  -- 1. Obtener y validar la solicitud
  SELECT * INTO v_application
  FROM enrollment_applications
  WHERE id = application_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Solicitud no encontrada o ya procesada'
    );
  END IF;

  -- 2. Validar sección
  SELECT * INTO v_section FROM sections WHERE sections.id = section_id;
  IF v_section.grade_level_id != v_application.grade_level_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'La sección no corresponde al grado solicitado'
    );
  END IF;

  -- 3. Buscar o crear apoderado
  SELECT id INTO v_guardian_id
  FROM guardians
  WHERE document_number = v_application.guardian_document_number;

  IF v_guardian_id IS NULL THEN
    -- Crear cuenta de usuario para el apoderado
    v_temp_password := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10);
    
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
    VALUES (
      v_application.guardian_email,
      crypt(v_temp_password, gen_salt('bf')),
      NOW()
    )
    RETURNING id INTO v_guardian_user_id;

    -- Crear perfil del apoderado
    INSERT INTO profiles (
      id, email, role, first_name, last_name, phone,
      is_active, created_at
    )
    VALUES (
      v_guardian_user_id,
      v_application.guardian_email,
      'guardian',
      v_application.guardian_first_name,
      v_application.guardian_last_name,
      v_application.guardian_phone,
      TRUE,
      NOW()
    );

    -- Crear registro en guardians
    INSERT INTO guardians (
      id, user_id, first_name, last_name,
      document_type, document_number, phone, email, address, relationship
    )
    VALUES (
      uuid_generate_v4(),
      v_guardian_user_id,
      v_application.guardian_first_name,
      v_application.guardian_last_name,
      v_application.guardian_document_type,
      v_application.guardian_document_number,
      v_application.guardian_phone,
      v_application.guardian_email,
      v_application.guardian_address,
      v_application.guardian_relationship
    )
    RETURNING id INTO v_guardian_id;
  END IF;

  -- 4. Generar código de estudiante secuencial
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_code FROM 4) AS INTEGER)), 0) + 1
  INTO v_max_code
  FROM students
  WHERE student_code ~ '^EST[0-9]+$';

  v_student_code := 'EST' || LPAD(v_max_code::TEXT, 6, '0');

  -- 5. Crear estudiante
  INSERT INTO students (
    id, student_code, first_name, last_name,
    document_type, document_number, birth_date, gender,
    guardian_id, section_id, enrollment_date,
    address, has_special_needs, special_needs_description,
    emergency_contact_name, emergency_contact_phone,
    is_active, created_at
  )
  VALUES (
    uuid_generate_v4(),
    v_student_code,
    v_application.student_first_name,
    v_application.student_last_name,
    v_application.student_document_type,
    v_application.student_document_number,
    v_application.student_birth_date,
    v_application.student_gender,
    v_guardian_id,
    section_id,
    NOW(),
    v_application.student_address,
    v_application.has_special_needs,
    v_application.special_needs_description,
    v_application.emergency_contact_name,
    v_application.emergency_contact_phone,
    TRUE,
    NOW()
  )
  RETURNING id INTO v_student_id;

  -- 6. Actualizar solicitud
  UPDATE enrollment_applications
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = approved_by
  WHERE id = application_id;

  -- 7. Crear notificación para el apoderado
  INSERT INTO notifications (
    user_id, type, title, message, is_read, created_at
  )
  VALUES (
    v_guardian_user_id,
    'enrollment_approved',
    'Matrícula Aprobada',
    'Su solicitud de matrícula para ' || v_application.student_first_name || ' ' ||
    v_application.student_last_name || ' ha sido aprobada. Código de estudiante: ' ||
    v_student_code,
    FALSE,
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'student_id', v_student_id,
    'student_code', v_student_code,
    'guardian_id', v_guardian_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 Componentes Frontend

### 1. EnrollmentApplicationForm.tsx

**Ubicación**: `src/components/admissions/EnrollmentApplicationForm.tsx`

Formulario público de 4 pasos para solicitud de matrícula.

**Características**:
- ✅ 4 secciones organizadas (Estudiante, Apoderado, Académico, Emergencia)
- ✅ Validación completa de campos
- ✅ Selección de grado con carga dinámica
- ✅ Checkbox para necesidades especiales
- ✅ Mensaje de éxito con instrucciones
- ✅ Carga automática del año académico activo
- ✅ Diseño responsivo con Tailwind CSS

**Props**: Ninguna (componente autocontenido)

**Estados**:
- `formData`: Objeto con todos los campos del formulario
- `gradeLevels`: Lista de grados disponibles
- `academicYearId`: ID del año académico activo
- `submitting`: Estado de envío
- `error`: Mensaje de error
- `success`: Estado de éxito

**Validaciones**:
- Nombres y apellidos requeridos
- Documento requerido
- Fecha de nacimiento requerida
- Email válido
- Teléfono requerido
- Grado seleccionado

### 2. EnrollmentApplicationsList.tsx

**Ubicación**: `src/components/admissions/EnrollmentApplicationsList.tsx`

Lista de solicitudes con modal de detalle y aprobación.

**Características**:
- ✅ Filtrado por estado (pendiente, aprobada, rechazada)
- ✅ Vista de tarjetas con información resumida
- ✅ Modal de detalle con toda la información
- ✅ Aprobación con selección de sección
- ✅ Rechazo con motivo obligatorio
- ✅ Actualización automática después de acciones
- ✅ Badges de estado visual

**Props**: Ninguna

**Estados**:
- `applications`: Array de solicitudes
- `loading`: Estado de carga
- `filterStatus`: Filtro seleccionado
- `selectedApplication`: Solicitud seleccionada para detalle

### 3. ApplicationDetailModal (subcomponente)

Modal para ver detalle completo y aprobar/rechazar solicitud.

**Props**:
- `application`: Solicitud a mostrar
- `onClose`: Función para cerrar modal
- `onApprove`: Callback de aprobación exitosa
- `onReject`: Callback de rechazo

**Características**:
- ✅ Muestra toda la información organizada por secciones
- ✅ Calcula edad del estudiante automáticamente
- ✅ Carga secciones disponibles del grado solicitado
- ✅ Muestra capacidad de cada sección
- ✅ Formulario de rechazo con motivo
- ✅ Indicadores de estado para solicitudes procesadas

### 4. EnrollmentApprovalsPage.tsx

**Ubicación**: `src/pages/admissions/EnrollmentApprovalsPage.tsx`

Página completa con layout y lista de solicitudes.

**Características**:
- ✅ AppLayout integrado
- ✅ Título y descripción
- ✅ Icono de checkmark
- ✅ Integra EnrollmentApplicationsList

---

## 🛣️ Rutas y Navegación

### Ruta Pública

```tsx
<Route path="/admisiones" element={<AdmissionsPage />} />
```

- **Acceso**: Público (sin autenticación)
- **Componente**: `AdmissionsPage` con `EnrollmentApplicationForm` integrado
- **URL**: `/admisiones`

### Ruta Protegida (Staff)

```tsx
<Route
  path="/admissions/applications"
  element={
    <ProtectedRoute allowedRoles={['admin', 'director', 'secretary', 'coordinator']}>
      <EnrollmentApprovalsPage />
    </ProtectedRoute>
  }
/>
```

- **Acceso**: admin, director, secretary, coordinator
- **Componente**: `EnrollmentApprovalsPage`
- **URL**: `/admissions/applications`

### Sidebar

```tsx
{
  path: '/admissions',
  label: 'Matrículas',
  icon: <UserPlus className="w-5 h-5" />,
  roles: ['admin', 'director', 'secretary', 'coordinator'],
  children: [
    { 
      path: '/admissions/applications', 
      label: 'Solicitudes', 
      roles: ['admin', 'director', 'secretary', 'coordinator'] 
    },
  ],
}
```

---

## 📝 Flujo de Usuario

### Para Familias (Público)

1. Visitar `/admisiones`
2. Completar formulario de 4 pasos:
   - Paso 1: Datos del estudiante
   - Paso 2: Datos del apoderado
   - Paso 3: Información académica
   - Paso 4: Contacto de emergencia
3. Enviar solicitud
4. Ver mensaje de confirmación con instrucciones
5. Esperar email de notificación (24-48 horas)

### Para Personal Administrativo

1. Iniciar sesión
2. Navegar a "Matrículas" → "Solicitudes"
3. Ver lista de solicitudes pendientes
4. Filtrar por estado si necesario
5. Click en "Ver Detalles" de una solicitud
6. Revisar información completa
7. **Para Aprobar**:
   - Seleccionar sección del desplegable
   - Click en "Aprobar Matrícula"
   - Sistema crea estudiante, apoderado y usuario automáticamente
   - Notificación enviada al apoderado
8. **Para Rechazar**:
   - Click en "Rechazar"
   - Escribir motivo del rechazo
   - Confirmar rechazo

---

## 🔄 Proceso de Aprobación (Técnico)

Cuando se aprueba una solicitud:

```
1. Validar solicitud está en estado "pending"
2. Validar sección pertenece al grado solicitado
3. Buscar apoderado existente por documento
   └── Si NO existe:
       ├── Crear usuario en auth.users con contraseña temporal
       ├── Crear perfil en profiles con role='guardian'
       └── Crear registro en guardians
4. Generar código de estudiante secuencial (EST000001, EST000002, ...)
5. Crear registro en students con todos los datos
6. Actualizar enrollment_applications:
   ├── status = 'approved'
   ├── reviewed_at = NOW()
   └── reviewed_by = admin_user_id
7. Crear notificación para el apoderado
8. Retornar JSON con IDs creados
```

---

## 📊 Estados de Solicitud

| Estado | Descripción | Quién puede cambiar |
|--------|-------------|---------------------|
| `pending` | Recién enviada, esperando revisión | Sistema (al crear) |
| `approved` | Aprobada, estudiante matriculado | Staff (secretaría, admin) |
| `rejected` | Rechazada con motivo | Staff (secretaría, admin) |
| `cancelled` | Cancelada por el solicitante | Apoderado o staff |

---

## 🎨 Diseño Visual

### Colores

- **Estudiante**: Azul (`bg-blue-50`, `text-blue-900`)
- **Apoderado**: Verde (`bg-green-50`, `text-green-900`)
- **Académico**: Púrpura (`bg-purple-50`, `text-purple-900`)
- **Emergencia**: Naranja (`bg-orange-50`, `text-orange-900`)

### Badges de Estado

- **Pendiente**: Amarillo (`variant="warning"`)
- **Aprobada**: Verde (`variant="success"`)
- **Rechazada**: Rojo (`variant="error"`)
- **Cancelada**: Gris (default)

---

## 🧪 Testing Checklist

### Migración (SQL)

- [ ] Ejecutar migración `20251208000007_add_enrollment_applications.sql`
- [ ] Verificar tabla `enrollment_applications` creada
- [ ] Verificar 6 índices creados
- [ ] Verificar trigger `update_enrollment_applications_updated_at` funciona
- [ ] Verificar función `approve_enrollment_application()` existe
- [ ] Verificar 5 políticas RLS activas
- [ ] Verificar vista `enrollment_application_stats` funciona

### Formulario Público

- [ ] Acceder a `/admisiones` sin autenticación
- [ ] Completar formulario con datos válidos
- [ ] Enviar solicitud
- [ ] Ver mensaje de éxito
- [ ] Verificar registro creado en `enrollment_applications` con status='pending'
- [ ] Probar validación de campos requeridos
- [ ] Probar checkbox de necesidades especiales
- [ ] Probar selección de grado dinámico

### Panel de Aprobación

- [ ] Iniciar sesión como admin/secretaría
- [ ] Navegar a "Matrículas" → "Solicitudes"
- [ ] Ver solicitud pendiente
- [ ] Click en "Ver Detalles"
- [ ] Verificar toda la información visible
- [ ] Seleccionar sección del desplegable
- [ ] Click en "Aprobar Matrícula"
- [ ] Verificar mensaje de éxito
- [ ] Verificar estudiante creado en tabla `students`
- [ ] Verificar apoderado creado en `guardians`
- [ ] Verificar usuario creado en `auth.users` y `profiles`
- [ ] Verificar código de estudiante generado (formato EST000001)
- [ ] Verificar notificación creada
- [ ] Verificar solicitud actualizada a status='approved'

### Rechazo

- [ ] Click en "Rechazar" en una solicitud pendiente
- [ ] Escribir motivo de rechazo
- [ ] Confirmar rechazo
- [ ] Verificar solicitud actualizada a status='rejected'
- [ ] Verificar `rejection_reason` guardado

### Filtros

- [ ] Cambiar filtro a "Todas las solicitudes"
- [ ] Cambiar filtro a "Aprobadas"
- [ ] Cambiar filtro a "Rechazadas"
- [ ] Verificar lista se actualiza correctamente

---

## 🚀 Instrucciones de Despliegue

### 1. Aplicar Migración

```bash
# Conectar a Supabase
psql postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Ejecutar migración
\i supabase/migrations/20251208000007_add_enrollment_applications.sql

# Verificar tabla creada
\d enrollment_applications

# Verificar función
\df approve_enrollment_application

# Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'enrollment_applications';
```

### 2. Verificar Año Académico Activo

```sql
SELECT * FROM academic_years WHERE is_active = TRUE;
-- Debe haber exactamente 1 año activo
```

### 3. Verificar Grados y Secciones

```sql
SELECT gl.name, gl.level_type, s.name AS section, s.capacity
FROM grade_levels gl
LEFT JOIN sections s ON s.grade_level_id = gl.id
ORDER BY gl.id, s.name;
```

### 4. Probar Función de Aprobación Manualmente

```sql
-- 1. Crear solicitud de prueba
INSERT INTO enrollment_applications (
  academic_year_id, student_first_name, student_last_name,
  student_document_type, student_document_number, student_birth_date, student_gender,
  guardian_first_name, guardian_last_name, guardian_document_type, guardian_document_number,
  guardian_phone, guardian_email, guardian_relationship, grade_level_id
)
VALUES (
  (SELECT id FROM academic_years WHERE is_active = TRUE),
  'Juan', 'Pérez', 'DNI', '12345678', '2015-05-10', 'M',
  'María', 'García', 'DNI', '87654321', '987654321', 'maria@test.com', 'Madre',
  (SELECT id FROM grade_levels WHERE name = '1ro Primaria')
)
RETURNING id;

-- 2. Aprobar solicitud
SELECT approve_enrollment_application(
  'ID_DE_SOLICITUD',
  (SELECT id FROM sections WHERE name = 'A' AND grade_level_id = (SELECT id FROM grade_levels WHERE name = '1ro Primaria')),
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- 3. Verificar resultados
SELECT * FROM students WHERE student_code LIKE 'EST%' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM guardians WHERE email = 'maria@test.com';
SELECT * FROM enrollment_applications WHERE student_first_name = 'Juan';
```

---

## 📦 Archivos del Módulo

```
supabase/migrations/
└── 20251208000007_add_enrollment_applications.sql (336 líneas)

src/components/admissions/
├── EnrollmentApplicationForm.tsx (450 líneas)
└── EnrollmentApplicationsList.tsx (520 líneas)

src/pages/admissions/
└── EnrollmentApprovalsPage.tsx (25 líneas)

src/pages/public/
└── AdmissionsPage.tsx (actualizado - formulario integrado)

src/routes/
└── AppRoutes.tsx (actualizado - nueva ruta)

src/components/layout/
└── Sidebar.tsx (actualizado - nuevo menú)
```

**Total**: ~1,500 líneas de código

---

## 🔧 Configuración de Permisos

### Roles con Acceso

| Rol | Ver Solicitudes | Aprobar | Rechazar | Ver Estadísticas |
|-----|----------------|---------|----------|------------------|
| admin | ✅ | ✅ | ✅ | ✅ |
| director | ✅ | ✅ | ✅ | ✅ |
| secretary | ✅ | ✅ | ✅ | ✅ |
| coordinator | ✅ | ✅ | ✅ | ✅ |
| guardian | ✅ (propias) | ❌ | ❌ | ❌ |
| teacher | ❌ | ❌ | ❌ | ❌ |
| student | ❌ | ❌ | ❌ | ❌ |

---

## 📈 Métricas y Estadísticas

### Vista de Estadísticas

```sql
SELECT * FROM enrollment_application_stats;
```

Columnas:
- `academic_year_id`: ID del año académico
- `grade_level_name`: Nombre del grado
- `level_type`: Tipo de nivel (Inicial, Primaria, Secundaria)
- `total_applications`: Total de solicitudes
- `pending_count`: Solicitudes pendientes
- `approved_count`: Solicitudes aprobadas
- `rejected_count`: Solicitudes rechazadas
- `approval_rate`: Tasa de aprobación (%)

---

## 🐛 Troubleshooting

### Error: "Solicitud no encontrada o ya procesada"

**Causa**: La solicitud no está en estado `pending`  
**Solución**: Verificar el estado actual de la solicitud

```sql
SELECT id, status FROM enrollment_applications WHERE id = 'ID_SOLICITUD';
```

### Error: "La sección no corresponde al grado solicitado"

**Causa**: La sección seleccionada no pertenece al grado de la solicitud  
**Solución**: Verificar que `section.grade_level_id = application.grade_level_id`

```sql
SELECT 
  s.id, s.name, s.grade_level_id,
  ea.grade_level_id AS requested_grade
FROM sections s
CROSS JOIN enrollment_applications ea
WHERE ea.id = 'ID_SOLICITUD' AND s.id = 'ID_SECCION';
```

### Error: "Email already exists"

**Causa**: Ya existe un usuario con ese email  
**Solución**: La función busca guardians existentes antes de crear usuario. Si el error persiste, verificar:

```sql
SELECT email FROM auth.users WHERE email = 'email@example.com';
SELECT email FROM guardians WHERE email = 'email@example.com';
```

### No se genera código de estudiante correctamente

**Causa**: Regex en la consulta MAX podría fallar  
**Solución**: Verificar códigos existentes:

```sql
SELECT student_code FROM students WHERE student_code ~ '^EST[0-9]+$' ORDER BY student_code DESC;
```

---

## 🎯 Próximos Pasos

### Mejoras Sugeridas

1. **Email Automático**: Enviar email con contraseña temporal al apoderado
2. **Carga de Documentos**: Permitir adjuntar documentos PDF (partida, DNI)
3. **Dashboard de Estadísticas**: Panel visual con gráficos de solicitudes
4. **Historial de Cambios**: Registrar quién revisó cada solicitud
5. **Exportación Excel**: Exportar lista de solicitudes
6. **Integración con Sistema de Pagos**: Link directo a matrícula financiera
7. **SMS Notification**: Enviar SMS además de email
8. **QR Code**: Generar QR del estudiante al matricular

### Módulos Relacionados

- **Módulo 4**: Dashboard Financiero (para ver deudas de nuevos estudiantes)
- **Módulo 5**: Asignación de Docentes (para asignar profesores a secciones con nuevos estudiantes)

---

## ✅ Checklist de Implementación

- [x] Crear migración SQL con tabla y función
- [x] Crear componente de formulario público
- [x] Integrar formulario en AdmissionsPage
- [x] Crear componente de lista de solicitudes
- [x] Crear modal de detalle con aprobación
- [x] Crear página EnrollmentApprovalsPage
- [x] Actualizar rutas en AppRoutes
- [x] Actualizar Sidebar con nuevo menú
- [x] Documentación completa
- [ ] Ejecutar migración en Supabase
- [ ] Testing de formulario público
- [ ] Testing de panel de aprobación
- [ ] Testing de aprobación automática
- [ ] Testing de rechazo con motivo
- [ ] Verificar notificaciones

---

## 📞 Soporte

Para problemas con este módulo:

1. Revisar logs de Supabase: Dashboard → Logs → Database
2. Verificar políticas RLS activas
3. Comprobar función `approve_enrollment_application()` con `\df` en psql
4. Verificar triggers activos con `\d enrollment_applications`

---

**Documentación generada**: 8 de diciembre de 2024  
**Autor**: Sistema de IA - GitHub Copilot  
**Versión del Sistema**: Cermat School v1.0  
**Estado**: ✅ COMPLETO (Pendiente testing)
