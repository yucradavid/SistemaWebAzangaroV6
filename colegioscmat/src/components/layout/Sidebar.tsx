import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  DollarSign,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  UserPlus,
  Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../lib/database.types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
  children?: Array<{ path: string; label: string; roles: UserRole[] }>;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Inicio',
    icon: <Home className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'secretary', 'teacher', 'student', 'guardian', 'finance', 'cashier', 'web_editor'],
  },
  {
    path: '/admissions',
    label: 'Matrículas',
    icon: <UserPlus className="w-5 h-5" />,
    roles: ['admin', 'director', 'secretary', 'coordinator'],
    children: [
      { path: '/admissions/applications', label: 'Solicitudes', roles: ['admin', 'director', 'secretary', 'coordinator'] },
    ],
  },
  {
    path: '/attendance',
    label: 'Asistencia',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'secretary', 'teacher', 'student', 'guardian'],
    children: [
      { path: '/attendance/teacher', label: 'Registro', roles: ['admin', 'director', 'coordinator', 'teacher'] },
      { path: '/attendance/student', label: 'Mi asistencia', roles: ['student'] },
      { path: '/attendance/guardian', label: 'Justificar', roles: ['guardian'] },
      { path: '/attendance/approvals', label: 'Aprobaciones', roles: ['admin', 'director', 'secretary', 'coordinator'] },
    ],
  },
  {
    path: '/evaluation',
    label: 'Evaluación',
    icon: <GraduationCap className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'teacher', 'student', 'guardian'],
    children: [
      { path: '/evaluation/teacher', label: 'Registrar notas', roles: ['admin', 'director', 'coordinator', 'teacher'] },
      { path: '/evaluation/student', label: 'Mis calificaciones', roles: ['student'] },
      { path: '/evaluation/guardian', label: 'Calificaciones', roles: ['guardian'] },
      { path: '/evaluation/review', label: 'Gestión', roles: ['admin', 'director', 'coordinator'] },
    ],
  },
  {
    path: '/tasks',
    label: 'Tareas',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'teacher', 'student', 'guardian'],
    children: [
      { path: '/tasks/teacher', label: 'Gestionar tareas', roles: ['admin', 'director', 'coordinator', 'teacher'] },
      { path: '/tasks/grading', label: 'Calificar entregas', roles: ['admin', 'director', 'coordinator', 'teacher'] },
      { path: '/tasks/student', label: 'Mis tareas', roles: ['student'] },
      { path: '/tasks/guardian', label: 'Tareas de mis hijos', roles: ['guardian'] },
    ],
  },
  {
    path: '/communications',
    label: 'Comunicados',
    icon: <MessageSquare className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'teacher', 'student', 'guardian'],
    children: [
      { path: '/communications/teacher', label: 'Gestionar comunicados', roles: ['admin', 'director', 'coordinator', 'teacher'] },
      { path: '/communications/student', label: 'Mis comunicados', roles: ['student'] },
      { path: '/communications/guardian', label: 'Comunicados de mis hijos', roles: ['guardian'] },
      { path: '/communications/review', label: 'Aprobar comunicados', roles: ['admin', 'director', 'coordinator'] },
    ],
  },
  {
    path: '/messages',
    label: 'Mensajería',
    icon: <Mail className="w-5 h-5" />,
    roles: ['teacher', 'guardian', 'admin', 'director'],
    children: [
      { path: '/messages/teacher', label: 'Mis conversaciones', roles: ['teacher', 'admin', 'director', 'coordinator'] },
      { path: '/messages/guardian', label: 'Mensajes con docentes', roles: ['guardian', 'admin', 'director'] },
    ],
  },
  {
    path: '/finance',
    label: 'Finanzas',
    icon: <DollarSign className="w-5 h-5" />,
    roles: ['admin', 'director', 'finance', 'cashier', 'guardian'],
    children: [
      { path: '/finance/catalog/concepts', label: 'Conceptos', roles: ['admin', 'director', 'finance'] },
      { path: '/finance/catalog/plans', label: 'Planes', roles: ['admin', 'director', 'finance'] },
      { path: '/finance/catalog/discounts', label: 'Descuentos', roles: ['admin', 'director', 'finance'] },
      { path: '/finance/charges/emission', label: 'Emisión de cargos', roles: ['admin', 'finance'] },
      { path: '/finance/charges/student', label: 'Cuenta por alumno', roles: ['admin', 'director', 'finance'] },
      { path: '/finance/guardian', label: 'Estado de cuenta', roles: ['guardian', 'admin', 'director'] },
      { path: '/finance/cash', label: 'Caja', roles: ['admin', 'cashier', 'finance'] },
      { path: '/finance/cash/closures', label: 'Cierres de caja', roles: ['admin', 'cashier', 'finance', 'director'] },
      { path: '/finance/reports', label: 'Reportes', roles: ['admin', 'director', 'finance'] },
    ],
  },
  {
    path: '/reports',
    label: 'Reportes',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['admin', 'director', 'coordinator', 'teacher'],
    children: [
      { path: '/reports/academic', label: 'Reportes Académicos', roles: ['admin', 'director', 'coordinator', 'teacher'] },
    ],
  },
  {
    path: '/settings',
    label: 'Configuración',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin', 'director'],
    children: [
      { path: '/settings/users', label: 'Usuarios', roles: ['admin', 'director'] },
      { path: '/settings/enrollments', label: 'Matrículas', roles: ['admin', 'director', 'coordinator', 'secretary'] },
      { path: '/settings/students', label: 'Gestión de Estudiantes', roles: ['admin', 'director', 'coordinator', 'secretary'] },
      { path: '/settings/academic-years', label: 'Años lectivos', roles: ['admin', 'director'] },
      { path: '/settings/periods', label: 'Periodos', roles: ['admin', 'director'] },
      { path: '/settings/grades', label: 'Grados', roles: ['admin', 'director'] },
      { path: '/settings/sections', label: 'Secciones', roles: ['admin', 'director'] },
      { path: '/settings/courses', label: 'Cursos', roles: ['admin', 'director'] },
      { path: '/settings/competencies', label: 'Competencias', roles: ['admin', 'director'] },
      { path: '/settings/teacher-assignments', label: 'Asignar cursos a docentes', roles: ['admin', 'director', 'coordinator'] },
    ],
  },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/settings']);

  const filteredNavItems = navItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleNavigation = (path: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpanded(path);
    } else {
      navigate(path);
      if (isOpen) onToggle(); // Cerrar sidebar en móvil al navegar
    }
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#0E3A8A] text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        aria-label="Menú de navegación principal"
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gradient-to-b from-[#0E3A8A] to-[#0B1220] text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg" aria-hidden="true">
                <GraduationCap className="w-8 h-8 text-[#0E3A8A]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Cermat School</h1>
                <p className="text-xs text-blue-200">Azángaro, Perú</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 overflow-y-auto" aria-label="Navegación principal">
            {filteredNavItems.map((item) => {
              const isExpanded = expandedItems.includes(item.path);
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.path} className="mb-2">
                  <button
                    onClick={() => handleNavigation(item.path, !!hasChildren)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${
                        isActive && !hasChildren
                          ? 'bg-white text-[#0E3A8A] font-medium'
                          : 'text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children
                        ?.filter(child => profile?.role && child.roles.includes(profile.role))
                        .map((child) => (
                          <button
                            key={child.path}
                            onClick={() => {
                              navigate(child.path);
                              if (isOpen) onToggle();
                            }}
                            className={`
                              w-full text-left px-4 py-2 rounded-lg text-sm
                              transition-all duration-200
                              ${
                                location.pathname === child.path
                                  ? 'bg-white/20 font-medium'
                                  : 'text-blue-200 hover:bg-white/10'
                              }
                            `}
                          >
                            {child.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="px-4 py-3 mb-2 rounded-xl bg-white/10">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-blue-200 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
        />
      )}
    </>
  );
}
