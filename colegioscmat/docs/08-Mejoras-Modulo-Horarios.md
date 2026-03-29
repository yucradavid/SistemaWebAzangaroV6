# Mejoras y Refactorización del Módulo de Horarios

## 1. Introducción
Este documento detalla la reingeniería completa aplicada al módulo de **Gestión de Horarios (`AdminSchedulePage`)**. El objetivo principal fue migrar de una tabla estática y rígida a una interfaz moderna, interactiva y robusta que permita la gestión fluida de bloques horarios con validaciones en tiempo real y soporte para impresión profesional.

## 2. Principales Características Implementadas

### A. Interfaz Gráfica (UI) Renovada
- **Diseño de Grid Semanal**: Se reemplazó la tabla HTML por un layout basado en `CSS Grid` y posicionamiento absoluto calculado.
  - **Eje Y (Tiempo)**: Renderizado dinámico basado en pixeles por minuto (`PIXELS_PER_MINUTE`), permitiendo visualizar la duración real de las clases.
  - **Bloques Visuales**: Tarjetas de clases con colores personalizados por curso, esquinas redondeadas y sombras para profundidad.
  - **Guías Visuales**: Líneas horizontales y marcadores de hora para facilitar la lectura.

### B. Sistema de Validación Diferencial ("Intercambio de Sillas")
Se implementó un algoritmo de validación lógica compleja para permitir el intercambio de horarios sin conflictos artificiales.

- **Problema Anterior**: Al intentar mover "Matemáticas" (Lunes 8am) a "Historia" (Lunes 10am), el sistema bloqueaba el cambio porque la posición original de "Historia" seguía ocupada en la base de datos hasta guardar.
- **Solución**: Algoritmo `isTimeBlocked` y `validateOverlap` basado en **Estado Hipotético**.
  1. Se crea una lista de "Horarios Futuros".
  2. Se **excluyen** los registros de la DB que están siendo editados actualmente (en borradores).
  3. Se **inyectan** las nuevas posiciones de los borradores.
  4. La validación se ejecuta contra este escenario futuro, permitiendo que un espacio liberado por un borrador sea ocupado inmediatamente por otro curso.

### C. Sistema de Borradores y Persistencia por Lote
- **Edición No Destructiva**: Los cambios no se guardan inmediatamente en la DB. Se almacenan en un objeto de estado local `drafts`.
- **Persistencia Visual (Ghosting Fix)**:
  - Al editar un curso, su bloque original desaparece visualmente y es reemplazado por un bloque "Fantasma" (transparente/punteado) o la nueva posición en tiempo real.
  - Esto permite visualizar cómo quedará la semana completa antes de confirmar.
- **Guardado por Lote (`Batch Save`)**: Un solo botón "Guardar" envía todas las modificaciones pendientes en una única transacción (usando `Promise.all` para upserts).

### D. Lógica de Cancelación Robusta ("Nuclear Option")
Para evitar inconsistencias visuales (bloques fantasmas que persisten tras cancelar):
- **Limpieza de Sesión**: La función `handleCancel` ahora ejecuta `setDrafts({})`, eliminando **todos** los cambios no guardados de la sesión actual.
- **Seguridad**: Se implementó `window.onbeforeunload` para advertir al usuario si intenta recargar la página con borradores pendientes.
- **Botón de Restablecer**: Opción global para descartar todos los cambios y volver al estado servidor.

### E. Módulo de Impresión Nativa
- Se desarrolló un layout específico para impresión (`@media print`) que:
  - Oculta toda la interfaz de administración (Sidebar, Botones, Menús).
  - Inyecta un contenedor `#print-area` con dimensiones A4 exactas.
  - Renderiza una versión simplificada y de alto contraste del horario.
  - Soporta encabezados institucionales y selección de secciones.

## 3. Detalles Técnicos

### Componentes Clave
- **`AdminSchedulePage.tsx`**: Controlador principal "God Component" que maneja toda la lógica.
- **`Modal`**: Utilizado para la edición de bloques sin perder el contexto del grid.
- **`Select` (Time Inputs)**: Selectores de tiempo inteligentes que calculan `disabled={isTimeBlocked(...)}` en tiempo real.

### Estructura de Datos (Drafts)
```typescript
interface ScheduleForm {
  course_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string;
  color?: string;
  original_schedule_id?: string; // ID para Upsert
}

// Mapa de borradores: ID Curso -> Formulario
const [drafts, setDrafts] = useState<Record<string, ScheduleForm>>({});
```

## 4. Flujo de Trabajo (Workflow)
1. **Visualizar**: El admin selecciona una sección.
2. **Editar**: Clic en un bloque o botón "Agregar".
3. **Drafting**: Cambia horas/días. El sistema valida colisiones contra el futuro.
4. **Multitasking**: Puede cerrar el modal y abrir otro curso sin perder el cambio anterior (mientras no cancele la sesión).
5. **Confirmar**: Botón "Guardar" hace commit de todos los cambios a Supabase.

---
**Fecha de Implementación**: 17/12/2025
**Desarrollador**: Antigravity AI
