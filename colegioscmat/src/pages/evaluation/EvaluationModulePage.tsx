import {
    GraduationCap,
    Settings
} from 'lucide-react';
import { ModuleSquare } from '../../components/dashboard/ModuleSquare';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function EvaluationModulePage() {
    const items = [
        {
            title: 'Registrar Notas',
            description: 'Ingreso de calificaciones por curso',
            icon: GraduationCap,
            path: '/evaluation/teacher',
            color: 'bg-[#0f766e]', // Teal 700
        },
        {
            title: 'Gestión de Evaluaciones',
            description: 'Apertura y cierre de periodos',
            icon: Settings,
            path: '/evaluation/review',
            color: 'bg-[#0d9488]', // Teal 600
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-cermat-blue-dark">Evaluación</h1>
                    <p className="text-slate-600">Control de calificaciones y periodos académicos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item, index) => (
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
    );
}
