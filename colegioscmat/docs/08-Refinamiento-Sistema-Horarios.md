# 08 - Refinamiento del Sistema de Horarios: Conflictos y Persistencia

## Resumen
En esta iteración se abordaron problemas críticos de usabilidad en el módulo de gestión de horarios (`AdminSchedulePage`), específicamente relacionados con la detección de conflictos al editar bloques existentes y la gestión de borradores. Se optimizó el flujo de edición para evitar falsos positivos y se simplificó la experiencia eliminando la persistencia de borradores propensa a errores.

## Cambios Realizados

### 1. Corrección de "Self-Conflict" (Auto-Conflicto)
**Problema:** Al editar un bloque existente y cambiar el curso seleccionado, el sistema interpretaba la acción como la creación de un *nuevo* bloque. Si este nuevo curso ya tenía un horario en la misma franja (ej. al intercambiar horarios), el sistema detectaba un conflicto consigo mismo, impidiendo la edición.

**Solución Implementada:**
- **Rastreo de ID Original (`original_schedule_id`):** Se añadió este campo a la estructura del formulario (`ScheduleForm`).
- **Lógica de `handleCourseChange` Mejorada:**
    - Al cambiar de curso, el sistema busca automáticamente si existe un bloque en la base de datos para el nuevo curso en el horario actual.
    - Si existe, vincula el formulario a ese ID (`editingSchedule`), marcándolo como una **Edición** en lugar de una Creación.
    - Esto permite intercambiar o modificar bloques existentes sin disparar alertas de superposición falsas.

### 2. Gestión de Borradores (Drafts) Simplificada
**Solicitud:** El usuario reportó problemas con la funcionalidad de "Restaurar Configuración" (persistencia en `localStorage`) tras cierres inesperados, solicitando su eliminación temporal.

**Acciones:**
- **Eliminación de Persistencia:** Se removió la escritura en `localStorage`. Los borradores ahora solo viven en memoria mientras el modal está abierto.
- **Eliminación de UI de Alerta:** Se retiró el aviso "Configuración pendiente encontrada" y los botones de Restaurar/Descartar.
- **Mantenimiento de Switch Rápido:** Se conservó la capacidad de cambiar entre cursos dentro del modal *sin cerrar la ventana* y mantener los datos ingresados (state in-memory), facilitando la edición masiva sin riesgos de persistencia corrupta.

### 3. Limpieza y Optimización
- **Refactorización de Código:** Se corrigieron múltiples errores de linter y definiciones duplicadas en `AdminSchedulePage.tsx`.
- **Tipado Estricto:** Se solucionaron problemas de tipado en las llamadas RPC a Supabase.

## Estado Final
El módulo de horarios ahora permite una edición fluida y robusta. Los usuarios pueden corregir horarios, cambiar docentes y cursos sin bloqueos injustificados, y el modal siempre inicia en un estado limpio y predecible.
