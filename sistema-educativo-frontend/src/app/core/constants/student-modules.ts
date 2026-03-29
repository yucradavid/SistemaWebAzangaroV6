import { ICONS } from './icons';

export interface StudentModuleEntry {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const STUDENT_MODULES_LIST: StudentModuleEntry[] = [
  {
    title: 'Asistencia',
    description: 'Consulta tu récord de asistencia diario',
    icon: ICONS.calendar,
    path: '/app/attendance/student'
  },
  {
    title: 'Mis Notas',
    description: 'Visualiza tus calificaciones y promedios',
    icon: ICONS.graduationCap,
    path: '/app/evaluation/student'
  },
  {
    title: 'Historial',
    description: 'Revisa anos y periodos academicos cerrados',
    icon: ICONS.fileText,
    path: '/app/history/student'
  },
  {
    title: 'Tareas',
    description: 'Gestiona tus actividades y entregas',
    icon: ICONS.bookOpen,
    path: '/app/tasks/student'
  },
  {
    title: 'Comunicados',
    description: 'Avisos y mensajes institucionales',
    icon: ICONS.messageSquare,
    path: '/app/communications/student'
  },
  {
    title: 'Mi Progreso',
    description: 'Estadísticas de tu rendimiento académico',
    icon: ICONS.activity,
    path: '/app/dashboard/metrics/student'
  },
  {
    title: 'Mi Horario',
    description: 'Consulta tu programación de clases',
    icon: ICONS.clock,
    path: '/app/schedule/my'
  }
];
