import {
    MessageSquare,
    Megaphone
} from 'lucide-react';
import { ModuleSquare } from '../../components/dashboard/ModuleSquare';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function MessagesModulePage() {
    const items = [
        {
            title: 'Bandeja de Entrada',
            description: 'Mensajería directa con apoderados',
            icon: MessageSquare,
            path: '/messages/teacher', // Reusing the teacher view which seems to be the main chat interface
            color: 'bg-[#2563eb]', // Blue 600
        },
        {
            title: 'Gestionar Comunicados',
            description: 'Crear y editar avisos',
            icon: Megaphone,
            path: '/communications/teacher',
            color: 'bg-[#6d28d9]', // Violet 700
        },
        {
            title: 'Aprobar Comunicados',
            description: 'Revisión de anuncios institucionales',
            icon: Megaphone,
            path: '/communications/review',
            color: 'bg-[#7c3aed]', // Violet 600
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-cermat-blue-dark">Mensajería</h1>
                    <p className="text-slate-600">Centro de comunicaciones institucionales</p>
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
