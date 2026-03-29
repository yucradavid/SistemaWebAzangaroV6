# Módulo 4: Dashboard Financiero con Gráficos - Documentación Completa

**Estado**: ✅ COMPLETO  
**Fecha**: 8 de diciembre de 2024  
**Versión**: 1.0.0

---

## 📋 Resumen Ejecutivo

El Módulo 4 mejora el dashboard financiero existente agregando **visualizaciones interactivas** que permiten al personal administrativo analizar tendencias de recaudación y detectar problemas de morosidad por grado académico de forma visual e intuitiva.

### Características Principales

- ✅ Gráfico de línea con recaudación mensual (año actual vs año anterior)
- ✅ Gráfico de barras con porcentaje de morosidad por grado
- ✅ Indicadores de crecimiento año a año
- ✅ Tabla resumen de morosidad con detalles por grado
- ✅ Colores dinámicos basados en nivel de criticidad
- ✅ Tooltips informativos con detalles adicionales
- ✅ Datos en tiempo real desde Supabase
- ✅ Diseño responsivo

---

## 🎨 Componentes Creados

### 1. MonthlyCollectionChart.tsx

**Ubicación**: `src/components/charts/MonthlyCollectionChart.tsx`

Gráfico de línea que compara la recaudación mensual del año actual con el año anterior.

#### Características

- **Gráfico de línea doble**: Año actual (línea sólida azul) vs Año anterior (línea punteada gris)
- **Indicador de crecimiento**: Badge con porcentaje de variación (verde si positivo, rojo si negativo)
- **Totales anuales**: Muestra totales de ambos años en la cabecera
- **Tooltips interactivos**: Al pasar el cursor, muestra monto exacto del mes
- **Formato de moneda**: Valores formateados como S/ X,XXX
- **Eje Y optimizado**: Muestra valores en miles (k) para mejor lectura
- **Animación suave**: Transiciones fluidas al cargar datos

#### Datos Cargados

```typescript
// Consulta pagos del año actual
SELECT amount, payment_date 
FROM payments 
WHERE payment_date BETWEEN '2024-01-01' AND '2024-12-31'
  AND status = 'paid';

// Consulta pagos del año anterior
SELECT amount, payment_date 
FROM payments 
WHERE payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  AND status = 'paid';

// Agrupa por mes y suma montos
```

#### Cálculos

```typescript
// Crecimiento porcentual
const growthPercentage = ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;

// Suma por mes
const monthTotal = payments
  .filter(p => new Date(p.payment_date).getMonth() + 1 === monthNumber)
  .reduce((sum, p) => sum + Number(p.amount), 0);
```

#### Props

Ninguna (componente autocontenido con carga de datos interna)

#### Estados

- `data: MonthlyData[]` - Array de 12 meses con montos de ambos años
- `loading: boolean` - Indicador de carga
- `currentYearTotal: number` - Total recaudado año actual
- `previousYearTotal: number` - Total recaudado año anterior

---

### 2. DelinquencyByGradeChart.tsx

**Ubicación**: `src/components/charts/DelinquencyByGradeChart.tsx`

Gráfico de barras que muestra el porcentaje de morosidad por grado académico con colores según criticidad.

#### Características

- **Barras coloreadas dinámicamente**:
  - 🟢 Verde: < 15% (Morosidad baja)
  - 🟡 Amarillo: 15-29% (Morosidad media)
  - 🟠 Naranja: 30-49% (Morosidad alta)
  - 🔴 Rojo: ≥ 50% (Morosidad crítica)
- **Tabla resumen**: Detalle de cada grado con estudiantes morosos, total, porcentaje y deuda
- **Totales en cabecera**: Estudiantes morosos totales y deuda total acumulada
- **Tooltips enriquecidos**: Muestra conteo exacto de estudiantes y monto de deuda
- **Ordenamiento**: Grados ordenados por order_index (Inicial → Primaria → Secundaria)
- **Leyenda de colores**: Referencia visual de los rangos de criticidad

#### Datos Cargados

```typescript
// 1. Estudiantes activos con su grado
SELECT 
  id, 
  section_id,
  sections.grade_level_id,
  sections.grade_levels.name,
  sections.grade_levels.order_index
FROM students
WHERE is_active = true;

// 2. Cargos pendientes o vencidos
SELECT student_id, amount, status
FROM charges
WHERE status IN ('pending', 'overdue');

// 3. Agrupa por grado y calcula
// - Total de estudiantes por grado
// - Estudiantes únicos con deudas
// - Suma de deudas
// - Porcentaje de morosidad
```

#### Cálculos

```typescript
// Porcentaje de morosidad
const percentage = (delinquentStudents.size / totalStudents) * 100;

// Color dinámico basado en porcentaje
const getBarColor = (percentage: number) => {
  if (percentage >= 50) return '#dc2626'; // Rojo
  if (percentage >= 30) return '#f97316'; // Naranja
  if (percentage >= 15) return '#f59e0b'; // Amarillo
  return '#22c55e'; // Verde
};
```

#### Props

Ninguna (componente autocontenido con carga de datos interna)

#### Estados

- `data: DelinquencyData[]` - Array de grados con datos de morosidad
- `loading: boolean` - Indicador de carga
- `totalDelinquent: number` - Total de estudiantes morosos
- `totalAmount: number` - Total de deuda acumulada

---

## 🔧 Integración en FinanceDashboard

### Antes (Sin gráficos)

```tsx
<div className="grid md:grid-cols-2 gap-6">
  {/* Antigüedad de saldos */}
  {/* Pagos recientes */}
</div>
```

### Después (Con gráficos)

```tsx
{/* Gráficos principales */}
<div className="grid lg:grid-cols-2 gap-6">
  <MonthlyCollectionChart />
  <DelinquencyByGradeChart />
</div>

<div className="grid md:grid-cols-2 gap-6">
  {/* Antigüedad de saldos */}
  {/* Pagos recientes */}
</div>
```

### Imports Agregados

```tsx
import { MonthlyCollectionChart } from '../../components/charts/MonthlyCollectionChart';
import { DelinquencyByGradeChart } from '../../components/charts/DelinquencyByGradeChart';
```

---

## 📚 Biblioteca Recharts

### Instalación

```bash
npm install recharts
```

**Versión**: 2.x (compatible con React 18)

### Componentes Utilizados

#### En MonthlyCollectionChart

```tsx
import {
  LineChart,      // Contenedor del gráfico de línea
  Line,           // Líneas de datos
  XAxis,          // Eje X (meses)
  YAxis,          // Eje Y (montos)
  CartesianGrid,  // Grilla de fondo
  Tooltip,        // Tooltips interactivos
  Legend,         // Leyenda
  ResponsiveContainer // Contenedor responsivo
} from 'recharts';
```

#### En DelinquencyByGradeChart

```tsx
import {
  BarChart,        // Contenedor del gráfico de barras
  Bar,             // Barras de datos
  XAxis,           // Eje X (grados)
  YAxis,           // Eje Y (porcentajes)
  CartesianGrid,   // Grilla de fondo
  Tooltip,         // Tooltips interactivos
  ResponsiveContainer, // Contenedor responsivo
  Cell             // Celdas individuales para colores dinámicos
} from 'recharts';
```

### Configuración Común

```tsx
<ResponsiveContainer width="100%" height={320}>
  <ChartType data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
    <XAxis 
      dataKey="key"
      tick={{ fill: '#6b7280', fontSize: 12 }}
      axisLine={{ stroke: '#e5e7eb' }}
    />
    <YAxis 
      tick={{ fill: '#6b7280', fontSize: 12 }}
      axisLine={{ stroke: '#e5e7eb' }}
    />
    <Tooltip {...} />
  </ChartType>
</ResponsiveContainer>
```

---

## 🎨 Diseño y UX

### Colores del Sistema

| Uso | Color | Hex |
|-----|-------|-----|
| Línea año actual | Azul principal | `#2563eb` |
| Línea año anterior | Gris | `#9ca3af` |
| Morosidad baja | Verde | `#22c55e` |
| Morosidad media | Amarillo | `#f59e0b` |
| Morosidad alta | Naranja | `#f97316` |
| Morosidad crítica | Rojo | `#dc2626` |

### Responsive Design

```tsx
// Layout adaptativo
<div className="grid lg:grid-cols-2 gap-6">
  {/* En pantallas grandes: 2 columnas */}
  {/* En pantallas pequeñas: 1 columna */}
</div>

// Contenedor responsivo de Recharts
<ResponsiveContainer width="100%" height={320}>
  {/* Se adapta al ancho del contenedor padre */}
</ResponsiveContainer>
```

### Estados de Carga

```tsx
if (loading) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </Card>
  );
}
```

---

## 📊 Casos de Uso

### 1. Análisis de Tendencias

**Objetivo**: Comparar recaudación actual con año anterior

**Cómo usar**:
1. Navegar a Dashboard Financiero
2. Ver gráfico "Recaudación Mensual"
3. Observar las dos líneas (azul = 2024, gris = 2023)
4. Revisar badge de crecimiento (verde/rojo)
5. Identificar meses con mayor/menor recaudación

**Insights**:
- ¿Hay crecimiento o decrecimiento?
- ¿Qué meses tienen mejor desempeño?
- ¿Hay estacionalidad en los pagos?

### 2. Detección de Problemas de Morosidad

**Objetivo**: Identificar grados con mayor morosidad

**Cómo usar**:
1. Ver gráfico "Morosidad por Grado"
2. Identificar barras rojas/naranjas (alta morosidad)
3. Revisar tabla resumen debajo del gráfico
4. Verificar cantidad de estudiantes morosos y monto adeudado

**Acciones**:
- Barras rojas (≥50%): Acción urgente, reunión con apoderados
- Barras naranjas (30-49%): Seguimiento cercano, recordatorios
- Barras amarillas (15-29%): Monitoreo regular
- Barras verdes (<15%): Mantener estrategia actual

### 3. Generación de Reportes

**Objetivo**: Usar datos visuales para informes gerenciales

**Información disponible**:
- Total recaudado año actual vs anterior
- Porcentaje de crecimiento/decrecimiento
- Listado de grados con morosidad crítica
- Monto total de deudas pendientes

---

## 🔍 Consultas SQL Subyacentes

### Recaudación Mensual

```sql
-- Año actual (2024)
SELECT 
  EXTRACT(MONTH FROM payment_date) AS month_number,
  SUM(amount) AS total_amount
FROM payments
WHERE payment_date BETWEEN '2024-01-01' AND '2024-12-31'
  AND status = 'paid'
GROUP BY month_number
ORDER BY month_number;

-- Año anterior (2023)
SELECT 
  EXTRACT(MONTH FROM payment_date) AS month_number,
  SUM(amount) AS total_amount
FROM payments
WHERE payment_date BETWEEN '2023-01-01' AND '2023-12-31'
  AND status = 'paid'
GROUP BY month_number
ORDER BY month_number;
```

### Morosidad por Grado

```sql
WITH student_debts AS (
  SELECT 
    s.id AS student_id,
    gl.name AS grade_name,
    gl.order_index,
    COUNT(c.id) AS debt_count,
    SUM(c.amount) AS debt_amount
  FROM students s
  INNER JOIN sections sec ON s.section_id = sec.id
  INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
  LEFT JOIN charges c ON s.id = c.student_id 
    AND c.status IN ('pending', 'overdue')
  WHERE s.is_active = TRUE
  GROUP BY s.id, gl.name, gl.order_index
),
grade_summary AS (
  SELECT 
    grade_name,
    order_index,
    COUNT(*) AS total_students,
    COUNT(*) FILTER (WHERE debt_count > 0) AS delinquent_students,
    SUM(debt_amount) AS total_debt
  FROM student_debts
  GROUP BY grade_name, order_index
)
SELECT 
  grade_name,
  total_students,
  delinquent_students,
  total_debt,
  ROUND((delinquent_students::NUMERIC / total_students * 100), 0) AS delinquency_percentage
FROM grade_summary
ORDER BY order_index;
```

---

## 🧪 Testing

### Testing Manual

#### 1. Gráfico de Recaudación Mensual

**Pre-requisitos**:
- Tener datos de pagos en tabla `payments` para 2023 y 2024
- Al menos 3-5 pagos por mes para visualización significativa

**Pasos**:
1. Iniciar sesión como admin/director
2. Navegar a Dashboard Financiero
3. Verificar que el gráfico carga sin errores
4. Verificar que muestra 12 meses en el eje X
5. Verificar que hay 2 líneas (azul sólida y gris punteada)
6. Pasar cursor sobre puntos → Debe mostrar tooltip con monto
7. Verificar totales anuales en la cabecera
8. Verificar badge de crecimiento (verde si +, rojo si -)

**Casos especiales**:
- Sin datos 2023: Debe mostrar línea gris en 0
- Sin datos 2024: Debe mostrar línea azul en 0
- Tablas vacías: Debe mostrar gráfico vacío sin error

#### 2. Gráfico de Morosidad por Grado

**Pre-requisitos**:
- Tener estudiantes activos en tabla `students`
- Tener grados configurados en `grade_levels`
- Tener cargos pendientes en `charges`

**Pasos**:
1. Navegar a Dashboard Financiero
2. Verificar que el gráfico carga sin errores
3. Verificar que muestra todos los grados en el eje X
4. Verificar colores de barras según porcentaje
5. Pasar cursor sobre barras → Tooltip con detalles
6. Verificar tabla resumen debajo del gráfico
7. Verificar totales en la cabecera

**Verificación de colores**:
- Crear grado con 10 estudiantes, 1 con deuda → Barra verde (10%)
- Crear grado con 10 estudiantes, 3 con deuda → Barra amarilla (30%)
- Crear grado con 10 estudiantes, 6 con deuda → Barra roja (60%)

### Datos de Prueba

```sql
-- Insertar pagos de prueba para gráfico de recaudación
INSERT INTO payments (student_id, amount, payment_date, status, concept_id) 
VALUES 
  -- Enero 2024
  ((SELECT id FROM students LIMIT 1), 350, '2024-01-15', 'paid', (SELECT id FROM financial_concepts LIMIT 1)),
  ((SELECT id FROM students LIMIT 1 OFFSET 1), 350, '2024-01-20', 'paid', (SELECT id FROM financial_concepts LIMIT 1)),
  -- Febrero 2024
  ((SELECT id FROM students LIMIT 1), 350, '2024-02-10', 'paid', (SELECT id FROM financial_concepts LIMIT 1)),
  ((SELECT id FROM students LIMIT 1 OFFSET 1), 350, '2024-02-15', 'paid', (SELECT id FROM financial_concepts LIMIT 1)),
  -- ... repetir para cada mes
  
  -- Enero 2023
  ((SELECT id FROM students LIMIT 1), 300, '2023-01-15', 'paid', (SELECT id FROM financial_concepts LIMIT 1)),
  ((SELECT id FROM students LIMIT 1 OFFSET 1), 300, '2023-01-20', 'paid', (SELECT id FROM financial_concepts LIMIT 1));

-- Insertar cargos pendientes para gráfico de morosidad
INSERT INTO charges (student_id, amount, due_date, status, concept_id)
VALUES 
  ((SELECT id FROM students WHERE section_id = (SELECT id FROM sections WHERE grade_level_id = (SELECT id FROM grade_levels WHERE name = '1ro Primaria') LIMIT 1) LIMIT 1), 350, '2024-11-01', 'overdue', (SELECT id FROM financial_concepts LIMIT 1)),
  ((SELECT id FROM students WHERE section_id = (SELECT id FROM sections WHERE grade_level_id = (SELECT id FROM grade_levels WHERE name = '2do Primaria') LIMIT 1) LIMIT 1), 350, '2024-11-01', 'pending', (SELECT id FROM financial_concepts LIMIT 1));
```

---

## 📦 Archivos del Módulo

```
src/components/charts/
├── MonthlyCollectionChart.tsx (200 líneas)
└── DelinquencyByGradeChart.tsx (280 líneas)

src/pages/dashboards/
└── FinanceDashboard.tsx (actualizado - imports y layout)

package.json (actualizado - recharts añadido)
```

**Total**: ~480 líneas de código nuevo

---

## 🚀 Instrucciones de Despliegue

### 1. Instalar Dependencias

```bash
cd /path/to/cermat
npm install
```

### 2. Verificar Recharts

```bash
npm list recharts
# Debe mostrar: recharts@2.x.x
```

### 3. Compilar y Ejecutar

```bash
npm run dev
```

### 4. Verificar en Navegador

```
http://localhost:5173/dashboard/finance
```

---

## 🐛 Troubleshooting

### Error: "recharts not found"

**Solución**:
```bash
npm install recharts --save
```

### Gráfico no muestra datos

**Verificar**:
1. ¿Hay datos en tabla `payments`?
   ```sql
   SELECT COUNT(*) FROM payments WHERE status = 'paid';
   ```
2. ¿Hay datos en tabla `charges`?
   ```sql
   SELECT COUNT(*) FROM charges WHERE status IN ('pending', 'overdue');
   ```
3. ¿Console muestra errores? (F12 → Console)

### Gráfico muy lento

**Causa**: Muchos registros en tabla payments

**Solución**: Agregar índices
```sql
CREATE INDEX idx_payments_date_status ON payments(payment_date, status);
CREATE INDEX idx_charges_student_status ON charges(student_id, status);
```

### Colores de barras no se muestran

**Causa**: Componente `Cell` de Recharts no importado

**Solución**: Verificar import
```tsx
import { ..., Cell } from 'recharts';
```

---

## 📈 Métricas de Rendimiento

### Tiempos de Carga

| Operación | Tiempo Esperado |
|-----------|----------------|
| Carga inicial de gráfico | < 1 segundo |
| Query de pagos (1 año) | < 500ms |
| Query de morosidad | < 300ms |
| Renderizado de gráfico | < 200ms |

### Optimizaciones

1. **Memoización**: Evitar recálculos innecesarios
2. **Índices DB**: Acelerar queries de agregación
3. **Lazy Loading**: Cargar gráficos solo cuando son visibles
4. **Debouncing**: Evitar múltiples llamadas simultáneas

---

## 🎯 Próximos Pasos

### Mejoras Sugeridas

1. **Exportar a PDF/Excel**: Permitir exportar gráficos como imagen
2. **Filtros de Fecha**: Selector de rango de meses personalizado
3. **Comparación Multi-año**: Ver 3+ años en el mismo gráfico
4. **Predicción de Tendencias**: Proyección de recaudación futura
5. **Gráfico de Pastel**: Distribución de ingresos por concepto
6. **Alertas Visuales**: Highlight de meses con baja recaudación
7. **Drill-down**: Click en barra → Ver estudiantes específicos
8. **Dashboard Completo**: Página dedicada solo a gráficos

---

## ✅ Checklist de Implementación

- [x] Instalar recharts
- [x] Crear MonthlyCollectionChart component
- [x] Crear DelinquencyByGradeChart component
- [x] Integrar en FinanceDashboard
- [x] Diseño responsivo
- [x] Estados de carga
- [x] Tooltips informativos
- [x] Colores según criticidad
- [x] Tabla resumen en morosidad
- [x] Documentación completa
- [ ] Testing con datos reales
- [ ] Optimización de queries
- [ ] Validación en diferentes resoluciones

---

**Documentación generada**: 8 de diciembre de 2024  
**Autor**: Sistema de IA - GitHub Copilot  
**Versión del Sistema**: Cermat School v1.0  
**Estado**: ✅ COMPLETO
