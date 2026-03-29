import { ICONS } from './icons';

export interface SubModuleItem {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export interface SubModuleSection {
  title: string;
  items: SubModuleItem[];
}

export interface AdminModuleEntry {
  title: string;
  description: string;
  icon: string;
  path: string;
  moduleKey?: string;
  color: string;
  roles: string[];
  submodules?: SubModuleSection[];
}

export const ADMIN_MODULES_LIST: AdminModuleEntry[] = [
  {
    title: 'Matrículas',
    description: 'Gestión de solicitudes y aprobación de matrículas',
    icon: ICONS.fileText,
    path: '/app/admissions/applications',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'secretary', 'coordinator']
  },
  {
    title: 'Asistencia',
    description: 'Supervisión de asistencia y justificaciones',
    icon: ICONS.calendarCheck,
    path: '/app/attendance/approvals',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'secretary', 'coordinator']
  },
  {
    title: 'Evaluación',
    description: 'Notas y gestión de periodos',
    icon: ICONS.graduationCap,
    path: '/app/evaluation',
    moduleKey: 'evaluation',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'coordinator'],
    submodules: [
      {
        title: 'Calificaciones',
        items: [
          {
            title: 'Registrar Notas',
            description: 'Ingreso de calificaciones por curso',
            icon: ICONS.graduationCap,
            path: '/app/evaluation/grade-entry'
          },
          {
            title: 'Gestión de Evaluaciones',
            description: 'Apertura y cierre de periodos',
            icon: ICONS.settings,
            path: '/app/evaluation/review'
          }
        ]
      }
    ]
  },
  {
    title: 'Tareas',
    description: 'Gestión de tareas y calificaciones',
    icon: ICONS.bookOpen,
    path: '/app/tasks',
    moduleKey: 'tasks',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'coordinator', 'teacher'],
    submodules: [
      {
        title: 'Actividades',
        items: [
          {
            title: 'Gestión de Tareas',
            description: 'Crear, editar y eliminar tareas',
            icon: ICONS.bookOpen,
            path: '/app/tasks/management'
          },
          {
            title: 'Calificar Entregas',
            description: 'Revisar y calificar trabajos',
            icon: ICONS.checkCircle2,
            path: '/app/tasks/grading'
          }
        ]
      }
    ]
  },
  {
    title: 'Finanzas',
    description: 'Gestión de cobros, caja y reportes financieros',
    icon: ICONS.dollarSign,
    path: '/app/finance',
    moduleKey: 'finance',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'secretary', 'finance', 'cashier'],
    submodules: [
      {
        title: 'Catálogo',
        items: [
          {
            title: 'Conceptos de Pago',
            description: 'Gestión de conceptos cobrables',
            icon: ICONS.tags,
            path: '/app/finance/catalog/concepts'
          },
          {
            title: 'Planes de Pago',
            description: 'Estructuras de pensiones y cuotas',
            icon: ICONS.fileText,
            path: '/app/finance/catalog/plans'
          },
          {
            title: 'Descuentos y Becas',
            description: 'Gestión de beneficios económicos',
            icon: ICONS.wallet,
            path: '/app/finance/catalog/discounts'
          }
        ]
      },
      {
        title: 'Gestión de Cargos',
        items: [
          {
            title: 'Emisión de Cargos',
            description: 'Generación masiva de deudas',
            icon: ICONS.creditCard,
            path: '/app/finance/charges/emission'
          },
          {
            title: 'Cuenta Corriente',
            description: 'Estado de cuenta por estudiante',
            icon: ICONS.users,
            path: '/app/finance/charges/student'
          }
        ]
      },
      {
        title: 'Caja y Tesorería',
        items: [
          {
            title: 'Caja Diaria',
            description: 'Registro de cobros y pagos',
            icon: ICONS.dollarSign,
            path: '/app/finance/cash'
          },
          {
            title: 'Cierres de Caja',
            description: 'Historial de cierres y arqueos',
            icon: ICONS.landmark,
            path: '/app/finance/cash/closures'
          }
        ]
      },
      {
        title: 'Reportes',
        items: [
          {
            title: 'Reportes Financieros',
            description: 'Indicadores y reportes de gestión',
            icon: ICONS.barChart3,
            path: '/app/finance/reports'
          }
        ]
      }
    ]
  },
  {
    title: 'Reportes',
    description: 'Reportes académicos y exportación SIAGIE',
    icon: ICONS.barChart3,
    path: '/app/reports/academic',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'coordinator', 'teacher']
  },
  {
    title: 'Mensajería',
    description: 'Bandeja de mensajes y comunicados',
    icon: ICONS.messageSquare,
    path: '/app/messages',
    moduleKey: 'messages',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'coordinator'],
    submodules: [
      {
        title: 'Gestión de Mensajes',
        items: [
          {
            title: 'Bandeja de Entrada',
            description: 'Mensajería directa con apoderados',
            icon: ICONS.messageSquare,
            path: '/app/messages/teacher'
          },
          {
            title: 'Gestionar Comunicados',
            description: 'Crear y editar avisos',
            icon: ICONS.megaphone,
            path: '/app/communications/teacher'
          },
          {
            title: 'Aprobar Comunicados',
            description: 'Revisión de anuncios institucionales',
            icon: ICONS.megaphone,
            path: '/app/communications/review'
          }
        ]
      }
    ]
  },
  {
    title: 'Configuración',
    description: 'Años académicos, grados y cursos',
    icon: ICONS.settings,
    path: '/app/settings',
    moduleKey: 'settings',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director'],
    submodules: [
      {
        title: 'Año Académico',
        items: [
          {
            title: 'Años Académicos',
            description: 'Gestión de años escolares (Apertura/Cierre)',
            icon: ICONS.calendar,
            path: '/app/settings/academic-years'
          },
          {
            title: 'Periodos',
            description: 'Trimestres, bimestres o semestres',
            icon: ICONS.clock,
            path: '/app/settings/periods'
          }
        ]
      },
      {
        title: 'Estructura Institucional',
        items: [
          {
            title: 'Grados y Niveles',
            description: 'Configuración de niveles educativos',
            icon: ICONS.school,
            path: '/app/settings/grades'
          },
          {
            title: 'Secciones',
            description: 'Gestión de aulas y turnos',
            icon: ICONS.layoutGrid,
            path: '/app/settings/sections'
          }
        ]
      },
      {
        title: 'Gestión Académica',
        items: [
          {
            title: 'Cursos',
            description: 'Catálogo de asignaturas',
            icon: ICONS.bookOpen,
            path: '/app/settings/courses'
          },
          {
            title: 'Competencias',
            description: 'Capacidades y criterios de evaluación',
            icon: ICONS.award,
            path: '/app/settings/competencies'
          },
          {
            title: 'Asignación Docente',
            description: 'Carga académica por profesor',
            icon: ICONS.graduationCap,
            path: '/app/settings/teacher-assignments'
          }
        ]
      },
      {
        title: 'Gestión Administrativa',
        items: [
          {
            title: 'Usuarios',
            description: 'Administradores, directores y personal',
            icon: ICONS.settings,
            path: '/app/settings/users'
          },
          {
            title: 'ImportaciÃ³n Masiva',
            description: 'Carga CSV de docentes, estudiantes y apoderados',
            icon: ICONS.download,
            path: '/app/settings/imports'
          },
          {
            title: 'Estudiantes',
            description: 'Directorio general de alumnos',
            icon: ICONS.users,
            path: '/app/settings/students'
          },
          {
            title: 'Config. Matrículas',
            description: 'Parámetros del proceso de admisión',
            icon: ICONS.fileText,
            path: '/app/settings/enrollments'
          }
        ]
      }
    ]
  },
  {
    title: 'Usuarios',
    description: 'Gestión de cuentas y permisos',
    icon: ICONS.users,
    path: '/app/settings/users',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director']
  },
  {
    title: 'Métricas',
    description: 'KPIs y estadísticas generales',
    icon: ICONS.activity,
    path: '/app/dashboard/metrics/admin',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director']
  },
  {
    title: 'Horarios',
    description: 'Gestión de horarios de clases',
    icon: ICONS.clock,
    path: '/app/schedule/admin',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'coordinator']
  },
  {
    title: 'Sitio Web',
    description: 'Gestión de noticias y contenido público',
    icon: ICONS.newspaper,
    path: '/app/settings/news',
    moduleKey: 'website',
    color: 'bg-[#1e293b]',
    roles: ['admin', 'director', 'secretary', 'web_editor'],
    submodules: [
      {
        title: 'Contenido Público',
        items: [
          {
            title: 'Noticias y Eventos',
            description: 'Gestionar noticias de la página pública',
            icon: ICONS.newspaper,
            path: '/app/settings/news'
          }
        ]
      }
    ]
  }
];
