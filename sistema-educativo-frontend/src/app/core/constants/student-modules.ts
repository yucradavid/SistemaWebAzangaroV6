import { ICONS } from './icons';

export interface StudentModuleEntry {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const STUDENT_MODULES_LIST: StudentModuleEntry[] = [
  {
    title: 'Marcar Asistencia',
    description: 'Registra tu entrada y salida',
    icon: ICONS.qrCode,
    path: '/app/attendance/mark'
  },
  {
    title: 'Mis Cursos',
    description: 'Notas, asistencia y horario en un solo lugar',
    icon: ICONS.layoutGrid,
    path: '/app/courses/student'
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
  }
];
