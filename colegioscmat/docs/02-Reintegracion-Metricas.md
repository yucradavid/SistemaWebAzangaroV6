# 02. Reintegración de Vistas de Métricas y KPIs

## Decisión de Arquitectura
Tras la eliminación del Sidebar, se perdió el acceso a las vistas de métricas predeterminadas por rol. Esta modificación aísla el contenido de KPIs y lo presenta como un módulo independiente.

## Implementación
- **Aislamiento de Contenido:** El contenido de KPIs, estadísticas y gráficos de 'recharts' de cada dashboard fue movido a componentes dedicados por rol (ej: `AdminMetricsPage.tsx`).
- **Navegación:** Se agregó un nuevo módulo 'Estadísticas Clave' (cuadrado grande) al portal de selección de cada usuario, apuntando a las nuevas rutas protegidas.
- **UX:** Se mantiene la arquitectura sin Sidebar, usando el `MinimalLayout` y el `GoBackButton.tsx` para retornar al portal de módulos.

## Impacto
El usuario puede acceder de forma directa y limpia al resumen de rendimiento sin saturar la interfaz inicial.
