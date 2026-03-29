import {
    Calendar,
    School,
    BookOpen,
    Award,
    Users,
    GraduationCap,
    Settings,
    Clock,
    LayoutGrid,
    FileText
} from 'lucide-react';
import { ModuleSquare } from '../../components/dashboard/ModuleSquare';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function SettingsModulePage() {
    const sections = [
        {
            title: 'Año Académico',
            items: [
                {
                    title: 'Años Académicos',
                    description: 'Gestión de años escolares (Apertura/Cierre)',
                    icon: Calendar,
                    path: '/settings/academic-years',
                    color: 'bg-[#1e3a8a]', // Blue 900
                },
                {
                    title: 'Periodos',
                    description: 'Trimestres, bimestres o semestres',
                    icon: Clock,
                    path: '/settings/periods',
                    color: 'bg-[#1d4ed8]', // Blue 700
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
                    color: 'bg-[#0f766e]', // Teal 700
                },
                {
                    title: 'Secciones',
                    description: 'Gestión de aulas y turnos',
                    icon: LayoutGrid,
                    path: '/settings/sections',
                    color: 'bg-[#059669]', // Emerald 600
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
                    color: 'bg-[#b91c1c]', // Red 700
                },
                {
                    title: 'Competencias',
                    description: 'Capacidades y criterios de evaluación',
                    icon: Award,
                    path: '/settings/competencies',
                    color: 'bg-[#c2410c]', // Orange 700
                },
                {
                    title: 'Asignación Docente',
                    description: 'Carga académica por profesor',
                    icon: GraduationCap,
                    path: '/settings/teacher-assignments',
                    color: 'bg-[#ca8a04]', // Yellow 600
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
                    color: 'bg-[#475569]', // Slate 600
                },
                {
                    title: 'Estudiantes',
                    description: 'Directorio general de alumnos',
                    icon: Users,
                    path: '/settings/students',
                    color: 'bg-[#334155]', // Slate 700
                },
                {
                    title: 'Config. Matrículas',
                    description: 'Parámetros del proceso de admisión',
                    icon: FileText,
                    path: '/settings/enrollments',
                    color: 'bg-[#1e293b]', // Slate 800
                },
            ]
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-cermat-blue-dark">Configuración</h1>
                    <p className="text-slate-600">Administración general del sistema educativo</p>
                </div>
            </div>

            <div className="space-y-8">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-4">
                        <h2 className="text-xl font-bold text-[#0F172A] border-l-4 border-cermat-blue-dark pl-3">
                            {section.title}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {section.items.map((item, index) => (
                                <ModuleSquare
                                    key={item.path}
                                    title={item.title}
                                    description={item.description}
                                    icon={item.icon}
                                    path={item.path}
                                    color="bg-[#1e3a8a]" // Cermat Primary Blue
                                    className="h-48 animate-fade-in-up opacity-0" // Reduced height
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
