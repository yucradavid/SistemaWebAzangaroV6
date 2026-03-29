import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { UserPlus, Search, Edit2, Lock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'director', label: 'Director' },
  { value: 'coordinator', label: 'Coordinador' },
  { value: 'secretary', label: 'Secretaria' },
  { value: 'teacher', label: 'Docente' },
  { value: 'student', label: 'Estudiante' },
  { value: 'guardian', label: 'Apoderado' },
  { value: 'finance', label: 'Finanzas' },
  { value: 'cashier', label: 'Cajero' },
  { value: 'web_editor', label: 'Editor Web' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar usuarios
  useEffect(() => {
    let filtered = [...users];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validaciones
    const errors: Record<string, string> = {};
    if (!formData.email) errors.email = 'Email requerido';
    if (!formData.password || formData.password.length < 6)
      errors.password = 'Contraseña debe tener al menos 6 caracteres';
    if (!formData.full_name) errors.full_name = 'Nombre completo requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      // 1. Crear usuario en auth.users (con Admin API)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // 2. Crear perfil en profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        is_active: true,
      });

      if (profileError) throw profileError;

      alert('Usuario creado exitosamente');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', full_name: '', role: 'student' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(`Error al crear usuario: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: formData.role })
        .eq('id', selectedUser.id);

      if (error) throw error;

      alert('Rol actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(`Error al actualizar rol: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: Profile) => {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${action} a ${user.email}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      alert(`Usuario ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(`Error al ${action} usuario: ${error.message}`);
    }
  };

  const handleResetPassword = async (user: Profile) => {
    const newPassword = prompt(
      `Ingrese la nueva contraseña para ${user.email} (mínimo 6 caracteres):`
    );
    if (!newPassword || newPassword.length < 6) {
      alert('Contraseña inválida');
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (error) throw error;

      alert('Contraseña actualizada exitosamente');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Error al resetear contraseña: ${error.message}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      director: 'bg-purple-100 text-purple-700',
      coordinator: 'bg-blue-100 text-blue-700',
      secretary: 'bg-pink-100 text-pink-700',
      teacher: 'bg-green-100 text-green-700',
      student: 'bg-yellow-100 text-yellow-700',
      guardian: 'bg-orange-100 text-orange-700',
      finance: 'bg-indigo-100 text-indigo-700',
      cashier: 'bg-teal-100 text-teal-700',
      web_editor: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find((r) => r.value === role)?.label || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-cermat-blue-dark">Gestión de Usuarios</h1>
          <p className="text-slate-600 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Crear Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro de rol */}
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Todos los roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>

          {/* Filtro de estado */}
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Usuarios</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Activos</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Inactivos</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u) => !u.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Docentes</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === 'teacher').length}
          </div>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-red-600">
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({ ...formData, role: user.role });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar rol"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Resetear contraseña"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={
                          user.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }
                        title={user.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {user.is_active ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron usuarios con los filtros aplicados
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Crear Usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={formErrors.email ? 'border-red-500' : ''}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña * (mínimo 6 caracteres)
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={formErrors.password ? 'border-red-500' : ''}
            />
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={formErrors.full_name ? 'border-red-500' : ''}
              placeholder="Juan Pérez García"
            />
            {formErrors.full_name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Rol */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Rol de Usuario"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <p className="text-sm text-gray-600">
              {selectedUser?.full_name} ({selectedUser?.email})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Rol</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} disabled={submitting}>
              {submitting ? 'Actualizando...' : 'Actualizar Rol'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
