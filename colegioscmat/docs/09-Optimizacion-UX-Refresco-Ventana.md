# Optimización de UX: Sincronización de Horarios y Refresco de Ventana

Este documento detalla las mejoras implementadas para optimizar la experiencia de usuario (UX) en el módulo de horarios y el sistema de autenticación global.

## 1. Sincronización de Interfaz de Horario
Se ha actualizado la vista de **"Mi Horario"** (Docentes, Estudiantes y Apoderados) para reflejar con precisión la duración de las clases.

- **Grid Proporcional**: Reemplazo de la tabla estática por una cuadrícula dinámica.
- **Visualización Proporcional**: Las clases de mayor duración ocupan un espacio proporcionalmente mayor en el grid, eliminando la ambigüedad visual.
- **Portabilidad de Lógica**: Se sincronizaron las constantes de tiempo y cálculos de píxeles por minuto con la vista de administrador.

## 2. Optimización de Refresco al Enfocar Ventana
Se ha eliminado el parpadeo de 1 segundo y la pantalla de carga global ("Verificando acceso...") que ocurría al volver a la pestaña de la aplicación.

### Problema Identificado
- **AuthContext**: Disparaba un estado de carga global en cada evento de refresco de sesión (común al recuperar el foco de la ventana).
- **useEffect Dependencies**: Los componentes de página dependían del objeto `profile` completo. Como `AuthContext` creaba un nuevo objeto tras refrescar, se disparaban re-renders y fetches de datos innecesarios.

### Soluciones Implementadas
- **Control con `useRef`**: Se introdujo `initialLoadDone` para asegurar que el estado de carga global solo ocurra una vez al inicio del ciclo de vida de la aplicación.
- **Preservación de Referencia**: `AuthContext` ahora compara los datos del perfil antes de actualizar el estado. Si los datos son idénticos, mantiene la misma referencia de objeto, evitando cascadas de re-renders.
- **Dependencias Optimizadas**: Se cambiaron las dependencias de `useEffect` en las páginas de `[profile]` a `[profile?.id]`.

## Impacto
- ✅ **UX Fluida**: El cambio entre aplicaciones es instantáneo y sin interrupciones visuales.
- ✅ **Integridad de Datos**: Se evitan fetchings redundantes, lo que reduce la carga en el servidor y mejora el rendimiento percibido.
- ✅ **Consistencia Visual**: Todas las vistas de horario ahora presentan la misma estructura y precisión.
