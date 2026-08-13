import { ICONS } from './icons';
import { AdminModuleEntry } from './admin-modules';

/**
 * Pestaña interna de un módulo agrupado del portal de Apoderado/Padre.
 */
export interface ModuleTab {
  path: string;
  label: string;
  icon: string;
}

/**
 * Módulos del portal de Apoderado/Padre.
 * Agrupados en 4 bloques para reducir la cantidad de tarjetas:
 *  1. Asistencia y Horario
 *  2. Académico (Notas, Tareas, Reporte)
 *  3. Comunicados y Mensajería
 *  4. Pagos e Historial
 * Cada path apunta a la shell con pestañas (module-tabs-shell) que carga
 * directamente la interfaz y permite cambiar entre ellas con botones internos.
 */
export const APODERADO_MODULES: AdminModuleEntry[] = [
  {
    title: 'Asistencia y Horario',
    description: 'Asistencia de mis hijos y horario de clases',
    icon: ICONS.calendarCheck,
    path: '/app/apoderado/asistencia-horario',
    color: 'bg-[#1e293b]',
    roles: ['apoderado', 'guardian']
  },
  {
    title: 'Académico',
    description: 'Notas, tareas y reporte de progreso',
    icon: ICONS.graduationCap,
    path: '/app/apoderado/academico',
    color: 'bg-[#1e293b]',
    roles: ['apoderado', 'guardian']
  },
  {
    title: 'Comunicados y Mensajería',
    description: 'Circulares, avisos y mensajes directos',
    icon: ICONS.messageSquare,
    path: '/app/apoderado/comunicacion',
    color: 'bg-[#1e293b]',
    roles: ['apoderado', 'guardian']
  },
  {
    title: 'Pagos e Historial',
    description: 'Estado de cuenta y historial familiar',
    icon: ICONS.creditCard,
    path: '/app/apoderado/pagos-historial',
    color: 'bg-[#1e293b]',
    roles: ['apoderado', 'guardian']
  }
];
