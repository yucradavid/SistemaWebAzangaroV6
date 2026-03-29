import {
    BookOpen,
    CheckCircle2
} from 'lucide-react';
import { ModuleSquare } from '../../components/dashboard/ModuleSquare';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function TasksModulePage() {
    const items = [
        {
            title: 'Gestión de Tareas',
            description: 'Crear, editar y eliminar tareas',
            icon: BookOpen,
            path: '/tasks/teacher',
            color: 'bg-[#1e3a8a]', // Blue 900
        },
        {
            title: 'Calificar Entregas',
            description: 'Revisar y calificar trabajos',
            icon: CheckCircle2,
            path: '/tasks/grading',
            color: 'bg-[#1d4ed8]', // Blue 700
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-cermat-blue-dark">Módulo de Tareas</h1>
                    <p className="text-slate-600">Gestión académica de actividades y evaluaciones</p>
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
