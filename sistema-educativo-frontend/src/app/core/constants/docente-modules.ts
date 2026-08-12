import { ICONS } from './icons';
import { AdminModuleEntry } from './admin-modules';

/**
 * Módulos del portal de Docente.
 * Agrupados en 4 bloques para reducir la cantidad de tarjetas:
 *  1. Asistencia y Horario
 *  2. Académico (Tareas, Calificar, Evaluación, Resumen)
 *  3. Comunicados y Mensajería
 *  4. Reportes e Historial
 * Cada path apunta a la shell con pestañas (module-tabs-shell) que carga
 * directamente la interfaz y permite cambiar entre ellas con botones internos.
 */
export const DOCENTE_MODULES: AdminModuleEntry[] = [
  {
    title: 'Asistencia y Horario',
    description: 'Marcado de asistencia, control diario y horario',
    icon: ICONS.calendarCheck,
    path: '/app/teacher/asistencia-horario',
    color: 'bg-[#1e293b]',
    roles: ['teacher']
  },
  {
    title: 'Académico',
    description: 'Tareas, calificaciones, evaluaciones y resumen',
    icon: ICONS.graduationCap,
    path: '/app/teacher/academico',
    color: 'bg-[#1e293b]',
    roles: ['teacher']
  },
  {
    title: 'Comunicados y Mensajería',
    description: 'Comunicados a padres y mensajes directos',
    icon: ICONS.messageSquare,
    path: '/app/teacher/comunicacion',
    color: 'bg-[#1e293b]',
    roles: ['teacher']
  },
  {
    title: 'Reportes e Historial',
    description: 'Reportes académicos y historial docente',
    icon: ICONS.barChart3,
    path: '/app/teacher/reportes-historial',
    color: 'bg-[#1e293b]',
    roles: ['teacher']
  }
];
