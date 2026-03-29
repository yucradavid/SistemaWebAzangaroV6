import {
    Tags, FileText, Wallet, CreditCard, Users, DollarSign, Landmark, BarChart3,
    Calendar, Clock, School, LayoutGrid, BookOpen, Award, GraduationCap, Settings,
    MessageSquare, Megaphone, CheckCircle2, Newspaper
} from 'lucide-react';

export const ADMIN_MODULES = {
    finance: {
        title: 'Finanzas',
        description: 'Gestión económica integral de la institución',
        sections: [
            {
                title: 'Catálogo',
                items: [
                    {
                        title: 'Conceptos de Pago',
                        description: 'Gestión de conceptos cobrables',
                        icon: Tags,
                        path: '/finance/catalog/concepts',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Planes de Pago',
                        description: 'Estructuras de pensiones y cuotas',
                        icon: FileText,
                        path: '/finance/catalog/plans',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Descuentos y Becas',
                        description: 'Gestión de beneficios económicos',
                        icon: Wallet,
                        path: '/finance/catalog/discounts',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Gestión de Cargos',
                items: [
                    {
                        title: 'Emisión de Cargos',
                        description: 'Generación masiva de deudas',
                        icon: CreditCard,
                        path: '/finance/charges/emission',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Cuenta Corriente',
                        description: 'Estado de cuenta por estudiante',
                        icon: Users,
                        path: '/finance/charges/student',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Caja y Tesorería',
                items: [
                    {
                        title: 'Caja Diaria',
                        description: 'Registro de cobros y pagos',
                        icon: DollarSign,
                        path: '/finance/cash',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Cierres de Caja',
                        description: 'Historial de cierres y arqueos',
                        icon: Landmark,
                        path: '/finance/cash/closures',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Reportes',
                items: [
                    {
                        title: 'Reportes Financieros',
                        description: 'Indicadores y reportes de gestión',
                        icon: BarChart3,
                        path: '/finance/reports',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    },
    settings: {
        title: 'Configuración',
        description: 'Administración general del sistema educativo',
        sections: [
            {
                title: 'Año Académico',
                items: [
                    {
                        title: 'Años Académicos',
                        description: 'Gestión de años escolares (Apertura/Cierre)',
                        icon: Calendar,
                        path: '/settings/academic-years',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Periodos',
                        description: 'Trimestres, bimestres o semestres',
                        icon: Clock,
                        path: '/settings/periods',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Estructura Institucional',
                items: [
                    {
                        title: 'Grados y Niveles',
                        description: 'Configuración de niveles educativos',
                        icon: School,
                        path: '/settings/grades',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Secciones',
                        description: 'Gestión de aulas y turnos',
                        icon: LayoutGrid,
                        path: '/settings/sections',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Gestión Académica',
                items: [
                    {
                        title: 'Cursos',
                        description: 'Catálogo de asignaturas',
                        icon: BookOpen,
                        path: '/settings/courses',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Competencias',
                        description: 'Capacidades y criterios de evaluación',
                        icon: Award,
                        path: '/settings/competencies',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Asignación Docente',
                        description: 'Carga académica por profesor',
                        icon: GraduationCap,
                        path: '/settings/teacher-assignments',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            },
            {
                title: 'Gestión Administrativa',
                items: [
                    {
                        title: 'Usuarios',
                        description: 'Administradores, directores y personal',
                        icon: Settings,
                        path: '/settings/users',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Estudiantes',
                        description: 'Directorio general de alumnos',
                        icon: Users,
                        path: '/settings/students',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Config. Matrículas',
                        description: 'Parámetros del proceso de admisión',
                        icon: FileText,
                        path: '/settings/enrollments',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    },
    messages: {
        title: 'Mensajería',
        description: 'Centro de comunicaciones institucionales',
        sections: [
            {
                title: 'Gestión de Mensajes',
                items: [
                    {
                        title: 'Bandeja de Entrada',
                        description: 'Mensajería directa con apoderados',
                        icon: MessageSquare,
                        path: '/messages/teacher',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Gestionar Comunicados',
                        description: 'Crear y editar avisos',
                        icon: Megaphone,
                        path: '/communications/teacher',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Aprobar Comunicados',
                        description: 'Revisión de anuncios institucionales',
                        icon: Megaphone,
                        path: '/communications/review',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    },
    website: {
        title: 'Sitio Web',
        description: 'Gestión de contenido del sitio web público',
        sections: [
            {
                title: 'Contenido Público',
                items: [
                    {
                        title: 'Noticias y Eventos',
                        description: 'Gestionar noticias de la página pública',
                        icon: Newspaper,
                        path: '/settings/news',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    },
    tasks: {
        title: 'Tareas',
        description: 'Gestión académica de actividades y evaluaciones',
        sections: [
            {
                title: 'Actividades',
                items: [
                    {
                        title: 'Gestión de Tareas',
                        description: 'Crear, editar y eliminar tareas',
                        icon: BookOpen,
                        path: '/tasks/teacher',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Calificar Entregas',
                        description: 'Revisar y calificar trabajos',
                        icon: CheckCircle2,
                        path: '/tasks/grading',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    },
    evaluation: {
        title: 'Evaluación',
        description: 'Control de calificaciones y periodos académicos',
        sections: [
            {
                title: 'Calificaciones',
                items: [
                    {
                        title: 'Registrar Notas',
                        description: 'Ingreso de calificaciones por curso',
                        icon: GraduationCap,
                        path: '/evaluation/teacher',
                        color: 'bg-[#1e3a8a]',
                    },
                    {
                        title: 'Gestión de Evaluaciones',
                        description: 'Apertura y cierre de periodos',
                        icon: Settings,
                        path: '/evaluation/review',
                        color: 'bg-[#1e3a8a]',
                    },
                ]
            }
        ]
    }
};
