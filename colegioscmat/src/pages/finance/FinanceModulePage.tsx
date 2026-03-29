import {
    Wallet,
    FileText,
    Tags,
    CreditCard,
    Users,
    DollarSign,
    BarChart3,
    Landmark
} from 'lucide-react';
import { ModuleSquare } from '../../components/dashboard/ModuleSquare';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function FinanceModulePage() {

    const sections = [
        {
            title: 'Catálogo',
            items: [
                {
                    title: 'Conceptos de Pago',
                    description: 'Gestión de conceptos cobrables',
                    icon: Tags,
                    path: '/finance/catalog/concepts',
                    color: 'bg-[#1e3a8a]', // Blue 900
                },
                {
                    title: 'Planes de Pago',
                    description: 'Estructuras de pensiones y cuotas',
                    icon: FileText,
                    path: '/finance/catalog/plans',
                    color: 'bg-[#1d4ed8]', // Blue 700
                },
                {
                    title: 'Descuentos y Becas',
                    description: 'Gestión de beneficios económicos',
                    icon: Wallet,
                    path: '/finance/catalog/discounts',
                    color: 'bg-[#0e7490]', // Cyan 700
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
                    color: 'bg-[#0f766e]', // Teal 700
                },
                {
                    title: 'Cuenta Corriente',
                    description: 'Estado de cuenta por estudiante',
                    icon: Users,
                    path: '/finance/charges/student',
                    color: 'bg-[#059669]', // Emerald 600
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
                    color: 'bg-[#b91c1c]', // Red 700
                },
                {
                    title: 'Cierres de Caja',
                    description: 'Historial de cierres y arqueos',
                    icon: Landmark,
                    path: '/finance/cash/closures',
                    color: 'bg-[#c2410c]', // Orange 700
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
                    color: 'bg-[#ca8a04]', // Yellow 600
                },
            ]
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <GoBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-cermat-blue-dark">Módulo de Finanzas</h1>
                    <p className="text-slate-600">Gestión económica integral de la institución</p>
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
