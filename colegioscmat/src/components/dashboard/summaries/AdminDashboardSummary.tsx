import { useState } from 'react';
import {
    Users,
    FileText,
    CalendarCheck,
    GraduationCap,
    DollarSign,
    BarChart3,
    Settings,
    MessageSquare,
    Activity,
    BookOpen,
    ArrowLeft,
    Clock,
    Newspaper
} from 'lucide-react';
import { ModuleSquare } from '../ModuleSquare';
import { useAuth } from '../../../contexts/AuthContext';
import { ADMIN_MODULES } from '../../../data/admin-modules';
import { Button } from '../../ui/Button';

type ModuleKey = keyof typeof ADMIN_MODULES;

export function AdminDashboardSummary() {
    const { profile } = useAuth();
    const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);

    const userRole = profile?.role;

    const allModules = [
        {
            title: 'Matrículas',
            description: 'Gestión de solicitudes y aprobación de matrículas',
            icon: FileText,
            path: '/admissions/applications',
            color: 'bg-[#1e293b]', // Slate 800
            roles: ['admin', 'director', 'secretary', 'coordinator']
        },
        {
            title: 'Asistencia',
            description: 'Supervisión de asistencia y justificaciones',
            icon: CalendarCheck,
            path: '/attendance/approvals',
            color: 'bg-[#1e40af]', // Blue 800
            roles: ['admin', 'director', 'secretary', 'coordinator']
        },
        {
            title: 'Evaluación',
            description: 'Notas y gestión de periodos',
            icon: GraduationCap,
            path: '/evaluation',
            moduleKey: 'evaluation',
            color: 'bg-[#0f766e]', // Teal 700
            roles: ['admin', 'director', 'coordinator']
        },
        {
            title: 'Tareas',
            description: 'Gestión de tareas y calificaciones',
            icon: BookOpen,
            path: '/tasks',
            moduleKey: 'tasks',
            color: 'bg-[#1e40af]', // Blue 800
            roles: ['admin', 'director', 'coordinator', 'teacher']
        },
        {
            title: 'Finanzas',
            description: 'Gestión de cobros, caja y reportes financieros',
            icon: DollarSign,
            path: '/finance',
            moduleKey: 'finance',
            color: 'bg-[#b91c1c]', // Red 700
            roles: ['admin', 'director', 'finance']
        },
        {
            title: 'Reportes',
            description: 'Reportes académicos y exportación SIAGIE',
            icon: BarChart3,
            path: '/reports/academic',
            color: 'bg-[#ca8a04]', // Yellow 600
            roles: ['admin', 'director', 'coordinator', 'teacher']
        },
        {
            title: 'Mensajería',
            description: 'Bandeja de mensajes y comunicados',
            icon: MessageSquare,
            path: '/messages',
            moduleKey: 'messages',
            color: 'bg-[#7c3aed]', // Violet 600
            roles: ['admin', 'director', 'coordinator']
        },
        {
            title: 'Configuración',
            description: 'Años académicos, grados y cursos',
            icon: Settings,
            path: '/settings',
            moduleKey: 'settings',
            color: 'bg-[#475569]', // Slate 600
            roles: ['admin', 'director']
        },
        {
            title: 'Usuarios',
            description: 'Gestión de cuentas y permisos',
            icon: Users,
            path: '/settings/users',
            color: 'bg-[#0E3A8A]', // UPeU Blue
            roles: ['admin', 'director']
        },
        {
            title: 'Métricas',
            description: 'KPIs y estadísticas generales',
            icon: Activity,
            path: '/dashboard/metrics/admin',
            color: 'bg-[#059669]', // Emerald 600
            roles: ['admin', 'director']
        },
        {
            title: 'Horarios',
            description: 'Gestión de horarios de clases',
            icon: Clock,
            path: '/schedule/admin',
            color: 'bg-[#7c3aed]', // Violet 600
            roles: ['admin', 'director', 'coordinator']
        },
        {
            title: 'Sitio Web',
            description: 'Gestión de noticias y contenido público',
            icon: Newspaper,
            path: '/settings/news',
            moduleKey: 'website',
            color: 'bg-[#0891b2]', // Cyan 600
            roles: ['admin', 'director', 'web_editor']
        }
    ];

    // Filter modules based on user role
    const modules = allModules.filter(m => userRole && m.roles.includes(userRole));

    // Handle module click: if it has a moduleKey, set activeModule, otherwise navigate
    const handleModuleClick = (module: any, e: React.MouseEvent) => {
        if (module.moduleKey) {
            e.preventDefault();
            setActiveModule(module.moduleKey as ModuleKey);
        }
    };

    // Render Submodule View
    if (activeModule) {
        const moduleData = ADMIN_MODULES[activeModule];
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => setActiveModule(null)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Panel
                    </Button>

                </div>

                <div className="space-y-8 mt-6">
                    {moduleData.sections.map((section) => (
                        <div key={section.title} className="space-y-4">
                            <h3 className="text-xl font-bold text-white border-l-4 border-yellow-500 pl-3">
                                {section.title}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {section.items.map((item, index) => (
                                    <ModuleSquare
                                        key={item.path}
                                        title={item.title}
                                        description={item.description}
                                        icon={item.icon}
                                        path={item.path}
                                        color={item.color}
                                        className="h-48 animate-fade-in-up opacity-0"
                                        style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Main Dashboard View
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.map((module, index) => (
                    <ModuleSquare
                        key={module.path}
                        title={module.title}
                        description={module.description}
                        icon={module.icon}
                        path={module.path}
                        color={module.color}
                        onClick={(e) => handleModuleClick(module, e)}
                        className="animate-fade-in-up opacity-0"
                        style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                    />
                ))}
            </div>
        </div>
    );
}
