import {
    CalendarCheck,
    GraduationCap,
    BookOpen,
    MessageSquare,
    Activity,
    Clock
} from 'lucide-react';
import { ModuleSquare } from '../ModuleSquare';

export function StudentDashboardSummary() {

    const modules = [
        {
            title: 'Asistencia',
            description: 'Mi historial de asistencia',
            icon: CalendarCheck,
            path: '/attendance/student',
            color: 'bg-[#1e40af]'
        },
        {
            title: 'Mis Notas',
            description: 'Visualizar calificaciones por periodo',
            icon: GraduationCap,
            path: '/evaluation/student',
            color: 'bg-[#1e3a8a]' // Blue 900
        },
        {
            title: 'Tareas',
            description: 'Ver tareas pendientes y entregadas',
            icon: BookOpen,
            path: '/tasks/student',
            color: 'bg-[#1e40af]' // Blue 800
        },
        {
            title: 'Comunicados',
            description: 'Anuncios y circulares',
            icon: MessageSquare,
            path: '/communications/student',
            color: 'bg-[#3b82f6]' // Blue 500
        },
        {
            title: 'Mi Progreso',
            description: 'Estadísticas y rendimiento',
            icon: Activity,
            path: '/dashboard/metrics/student',
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
            <div className="flex justify-between items-center mb-6">
                {/* Header removed as per request */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
