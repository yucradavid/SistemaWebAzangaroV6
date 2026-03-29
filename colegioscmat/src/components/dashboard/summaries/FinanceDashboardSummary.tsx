import {
    Receipt,
    Wallet,
    BarChart3,
    Tags,
    LogOut
} from 'lucide-react';
import { ModuleSquare } from '../ModuleSquare';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function FinanceDashboardSummary() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userRole = profile?.role;

    const allModules = [
        {
            title: 'Emisión',
            description: 'Generación masiva de cargos',
            icon: Receipt,
            path: '/finance/charges/emission',
            color: 'bg-[#1e40af]', // Blue 800
            roles: ['admin', 'finance']
        },
        {
            title: 'Caja',
            description: 'Cobros y movimientos diarios',
            icon: Wallet,
            path: '/finance/cash',
            color: 'bg-[#0f766e]', // Teal 700
            roles: ['admin', 'finance', 'cashier']
        },
        {
            title: 'Reportes',
            description: 'Balances y reportes de recaudación',
            icon: BarChart3,
            path: '/finance/reports',
            color: 'bg-[#b91c1c]', // Red 700
            roles: ['admin', 'finance', 'director']
        },
        {
            title: 'Catálogos',
            description: 'Conceptos, descuentos y planes',
            icon: Tags,
            path: '/finance/catalog/concepts',
            color: 'bg-[#ca8a04]', // Yellow 600
            roles: ['admin', 'finance', 'director']
        }
    ];

    // Filter modules based on user role
    const modules = allModules.filter(m => userRole && m.roles.includes(userRole));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#0F172A]">Panel Financiero</h1>
                    <p className="text-[#64748B]">Gestión de cobranzas y tesorería</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.map((module) => (
                    <ModuleSquare
                        key={module.path}
                        title={module.title}
                        description={module.description}
                        icon={module.icon}
                        path={module.path}
                        color={module.color}
                    />
                ))}
            </div>
        </div>
    );
}
