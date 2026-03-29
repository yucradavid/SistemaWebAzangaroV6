import {
    CalendarCheck,
    GraduationCap,
    BookOpen,
    CheckCircle2,
    MessageSquare,
    Mail,
    Activity,
    BarChart3,
    Clock
} from 'lucide-react';
import { ModuleSquare } from '../ModuleSquare';

export function TeacherDashboardSummary() {

    const modules = [
        {
            title: 'Asistencia',
            description: 'Registro diario de asistencia por sección',
            icon: CalendarCheck,
            path: '/attendance/teacher',
            color: 'bg-[#1e40af]' // Blue 800
        },
        {
            title: 'Evaluación',
            description: 'Registro de calificaciones y competencias',
            icon: GraduationCap,
            path: '/evaluation/teacher',
            color: 'bg-[#1e3a8a]' // Blue 900 - Cermat Primary
        },
        {
            title: 'Tareas',
            description: 'Creación y gestión de actividades',
            icon: BookOpen,
            path: '/tasks/teacher',
            color: 'bg-[#1e40af]' // Blue 800 - Cermat Primary
        },
        {
            title: 'Calificar',
            description: 'Revisión de entregas de tareas',
            icon: CheckCircle2,
            path: '/tasks/grading',
            color: 'bg-[#ca8a04]' // Yellow 600
        },
        {
            title: 'Comunicados',
            description: 'Envío de comunicados a padres y alumnos',
            icon: MessageSquare,
            path: '/communications/teacher',
            color: 'bg-[#3b82f6]' // Blue 500 - Cermat Secondary
        },
        {
            title: 'Mensajería',
            description: 'Buzón de mensajes directos',
            icon: Mail,
            path: '/messages/teacher',
            color: 'bg-[#0E3A8A]' // UPeU Blue
        },
        {
            title: 'Resumen',
            description: 'Estadísticas de cursos y alumnos',
            icon: Activity,
            path: '/dashboard/metrics/teacher',
            color: 'bg-[#374151]' // Slate 700
        },
        {
            title: 'Reportes',
            description: 'Reportes académicos y exportación',
            icon: BarChart3,
            path: '/reports/academic',
            color: 'bg-[#ca8a04]' // Yellow 600
        },
        {
            title: 'Mi Horario',
            description: 'Ver mi horario de clases',
            icon: Clock,
            path: '/schedule/my',
            color: 'bg-[#7c3aed]' // Violet 600
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module, index) => (
                    <ModuleSquare
                        key={module.path}
                        title={module.title}
                        description={module.description}
                        icon={module.icon}
                        path={module.path}
                        color={module.color}
                        className="animate-fade-in-up opacity-0"
                        style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                    />
                ))}
            </div>
        </div>
    );
}
