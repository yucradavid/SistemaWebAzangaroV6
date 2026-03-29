import {
    CalendarCheck,
    GraduationCap,
    CreditCard,
    BookOpen,
    MessageSquare,
    Mail,
    Activity,
    Clock
} from 'lucide-react';
import { ModuleSquare } from '../ModuleSquare';

export function GuardianDashboardSummary() {

    const modules = [
        {
            title: 'Asistencia',
            description: 'Control de asistencia y justificaciones',
            icon: CalendarCheck,
            path: '/attendance/guardian',
            color: 'bg-[#1e40af]'
        },
        {
            title: 'Notas',
            description: 'Seguimiento académico',
            icon: GraduationCap,
            path: '/evaluation/guardian',
            color: 'bg-[#1e3a8a]' // Blue 900
        },
        {
            title: 'Pagos',
            description: 'Estado de cuenta y pagos online',
            icon: CreditCard,
            path: '/finance/guardian',
            color: 'bg-[#1e40af]' // Blue 800
        },
        {
            title: 'Tareas',
            description: 'Supervisión de tareas escolares',
            icon: BookOpen,
            path: '/tasks/guardian',
            color: 'bg-[#ca8a04]'
        },
        {
            title: 'Comunicados',
            description: 'Circulares y avisos importantes',
            icon: MessageSquare,
            path: '/communications/guardian',
            color: 'bg-[#3b82f6]' // Blue 500
        },
        {
            title: 'Mensajería',
            description: 'Contacto con docentes',
            icon: Mail,
            path: '/messages/guardian',
            color: 'bg-[#0E3A8A]'
        },
        {
            title: 'Reporte',
            description: 'Progreso detallado de mis hijos',
            icon: Activity,
            path: '/dashboard/metrics/guardian',
            color: 'bg-[#ca8a04]' // Yellow 600
        },
        {
            title: 'Horario',
            description: 'Horario de clases de mis hijos',
            icon: Clock,
            path: '/schedule/my',
            color: 'bg-[#7c3aed]' // Violet 600
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-md">Portal de Apoderado</h1>
                    <p className="text-blue-100 font-medium">Información y seguimiento de sus hijos</p>
                </div>

            </div>

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
