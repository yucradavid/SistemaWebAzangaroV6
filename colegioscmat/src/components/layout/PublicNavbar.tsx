import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export function PublicNavbar() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handlePortalClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const navItems = [
        { label: 'Inicio', path: '/' },
        { label: 'Niveles', path: '/niveles' },
        { label: 'Docentes', path: '/docentes' },
        { label: 'Noticias', path: '/noticias' },
        { label: 'Contacto', path: '/contacto' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-cermat-blue-dark/95 backdrop-blur-md border-b border-white/10 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="p-2 bg-white/10 rounded-lg shadow-inner ring-1 ring-white/20">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Cermat School</h1>
                            <p className="text-xs text-blue-200">Azángaro, Perú</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="text-blue-100 hover:text-white transition-colors font-medium text-sm tracking-wide"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => navigate('/admisiones')}
                            variant="primary"
                            size="sm"
                            className="shadow-lg shadow-cermat-red/20 border-0"
                        >
                            Admisiones
                        </Button>
                        <Button
                            onClick={handlePortalClick}
                            variant="outline"
                            size="sm"
                            className="!text-white !border-white/30 hover:!bg-white/10 hover:!border-white"
                        >
                            {user ? 'Mi Dashboard' : 'Portal'}
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
