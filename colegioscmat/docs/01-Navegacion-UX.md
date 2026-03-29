# 01. Arquitectura de Navegación Exclusiva (Eliminación de Sidebar)

## Decisión de Arquitectura
Se eliminó la navegación lateral (Sidebar) de todas las rutas protegidas para evitar la redundancia y simplificar la Experiencia de Usuario (UX), enfocando la navegación en un portal de módulos centralizado.

## Implementación
- **Flujo Post-Login:** El usuario es redirigido a una vista limpia que solo muestra los Módulos Principales (cuadrados grandes).
- **Layout Mínimo:** Se implementó el `MinimalLayout` para envolver las rutas internas (solo Header y Contenido).
- **Control de Navegación:** El componente `GoBackButton.tsx` es obligatorio en todos los módulos internos para retornar al portal de selección de módulos (`/dashboard/inicio`).
- **Cerrar Sesión:** La opción de Cerrar Sesión es visible en la vista de cuadrados grandes y en el `MinimalLayout`.
