import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, GraduationCap, Home } from 'lucide-react';

interface MinimalLayoutProps {
    children: React.ReactNode;
}

export function MinimalLayout({ children }: MinimalLayoutProps) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDashboardHome = location.pathname === '/dashboard';

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className={`min-h-screen relative ${isDashboardHome ? 'bg-school-pattern bg-cover bg-center bg-fixed' : 'bg-slate-50'}`}>
            {/* Overlay oscuro solo para el dashboard principal */}
            {isDashboardHome && (
                <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />
            )}

            {/* Contenido (z-10 para estar sobre el overlay) */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header Simplificado (Glassmorphism) */}
                {/* Header Simplificado (Glassmorphism Dark) */}
                <header className="bg-cermat-blue-dark border-b border-white/10 px-6 py-4 shadow-md z-50">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl shadow-inner backdrop-blur-sm self-start">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">Colegio CMAT</h1>
                                {/* <p className="text-xs font-medium text-blue-200 mb-1">Sistema de Gestión Escolar</p> */}{/* Removed as requested */}

                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wide group w-fit mt-2"
                                    title="Ir a la página de inicio"
                                >
                                    <Home className="w-3 h-3 group-hover:text-cermat-yellow transition-colors" />
                                    <span className="group-hover:text-cermat-yellow transition-colors">Volver al Menú</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* User Info */}
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white">
                                    {profile?.full_name}
                                </p>
                                <p className="text-xs font-semibold text-white/80 capitalize bg-white/10 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-white/10">
                                    {profile?.role}
                                </p>
                            </div>

                            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-blue-200 hover:text-white hover:bg-cermat-red rounded-lg transition-all duration-200"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Contenido Principal */}
                <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
