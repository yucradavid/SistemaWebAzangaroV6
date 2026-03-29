import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';

type DiscountType = 'porcentaje' | 'monto_fijo';
type DiscountScope = 'todos' | 'pension' | 'matricula' | 'especifico';

interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  specific_concept_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fee_concept?: {
    id: string;
    name: string;
  };
}

interface FeeConcept {
  id: string;
  name: string;
}

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'porcentaje' as DiscountType,
    value: '',
    scope: 'todos' as DiscountScope,
    specific_concept_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [discountsRes, conceptsRes] = await Promise.all([
        supabase
          .from('discounts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('fee_concepts')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (discountsRes.error) throw discountsRes.error;
      if (conceptsRes.error) throw conceptsRes.error;

      // Manual JOIN: agregar fee_concept a cada discount
      const discountsWithConcepts = (discountsRes.data || []).map(discount => ({
        ...discount,
        fee_concept: discount.specific_concept_id
          ? conceptsRes.data?.find(c => c.id === discount.specific_concept_id)
          : null
      }));

      setDiscounts(discountsWithConcepts);
      setConcepts(conceptsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'porcentaje',
      value: '',
      scope: 'todos',
      specific_concept_id: '',
      is_active: true,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(discount: Discount) {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      scope: discount.scope,
      specific_concept_id: discount.specific_concept_id || '',
      is_active: discount.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  function openDeleteModal(discount: Discount) {
    setDiscountToDelete(discount);
    setDeleteModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      setError('El valor debe ser un número positivo');
      return;
    }

    if (formData.type === 'porcentaje' && value > 100) {
      setError('El porcentaje no puede ser mayor a 100%');
      return;
    }

    if (formData.scope === 'especifico' && !formData.specific_concept_id) {
      setError('Debes seleccionar un concepto específico');
      return;
    }

    try {
      setSaving(true);

      const discountData = {
        name: formData.name.trim(),
        type: formData.type,
        value: value,
        scope: formData.scope,
        specific_concept_id:
          formData.scope === 'especifico' ? formData.specific_concept_id : null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingDiscount) {
        const { error: updateError } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('discounts')
          .insert([discountData]);

        if (insertError) throw insertError;
      }

      setModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving discount:', error);
      setError(error.message || 'Error al guardar el descuento');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!discountToDelete) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountToDelete.id);

      if (error) {
        if (error.code === '23503') {
          alert(
            'No se puede eliminar este descuento porque está siendo utilizado por estudiantes.'
          );
        } else {
          throw error;
        }
      } else {
        setDeleteModalOpen(false);
        setDiscountToDelete(null);
        loadData();
      }
    } catch (error: any) {
      console.error('Error deleting discount:', error);
      alert('Error al eliminar el descuento');
    }
  }

  function getTypeBadge(type: DiscountType) {
    return type === 'porcentaje' ? (
      <Badge variant="info">%</Badge>
    ) : (
      <Badge variant="success">S/</Badge>
    );
  }

  function getScopeBadge(scope: DiscountScope) {
    const badges: Record<
      DiscountScope,
      { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'secondary' }
    > = {
      todos: { label: 'Todos', variant: 'success' },
      pension: { label: 'Pensión', variant: 'info' },
      matricula: { label: 'Matrícula', variant: 'warning' },
      especifico: { label: 'Específico', variant: 'secondary' },
    };
    const badge = badges[scope];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  }

  function formatValue(discount: Discount): string {
    if (discount.type === 'porcentaje') {
      return `${discount.value}%`;
    } else {
      return `S/ ${discount.value.toFixed(2)}`;
    }
  }

  const filteredDiscounts = discounts.filter((discount) => {
    if (filterType !== 'all' && discount.type !== filterType) return false;
    if (filterScope !== 'all' && discount.scope !== filterScope) return false;
    if (filterActive === 'active' && !discount.is_active) return false;
    if (filterActive === 'inactive' && discount.is_active) return false;
    return true;
  });

  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => d.is_active).length,
    percentage: discounts.filter((d) => d.type === 'porcentaje').length,
    fixedAmount: discounts.filter((d) => d.type === 'monto_fijo').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Descuentos</h1>
          <p className="text-[#334155] mt-1">
            Gestiona los descuentos aplicables a conceptos de cobro
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Descuento
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Total</p>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
              </div>
              <Tag className="w-8 h-8 text-[#3B82F6]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Activos</p>
                <p className="text-2xl font-bold text-[#10B981]">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Porcentaje</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.percentage}</p>
              </div>
              <div className="text-4xl">%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Monto Fijo</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{stats.fixedAmount}</p>
              </div>
              <div className="text-4xl">S/</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Tipo" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Todos</option>
              <option value="porcentaje">Porcentaje</option>
              <option value="monto_fijo">Monto Fijo</option>
            </Select>

            <Select
              label="Alcance"
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="todos">Todos los conceptos</option>
              <option value="pension">Solo pensión</option>
              <option value="matricula">Solo matrícula</option>
              <option value="especifico">Concepto específico</option>
            </Select>

            <Select
              label="Estado"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de descuentos */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Descuentos ({filteredDiscounts.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">No hay descuentos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Nombre
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Tipo
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Valor
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Alcance
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Estado
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-[#0F172A]">{discount.name}</p>
                          {discount.scope === 'especifico' && discount.fee_concept && (
                            <p className="text-sm text-[#64748B]">
                              Aplica a: {discount.fee_concept.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{getTypeBadge(discount.type)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#0F172A]">
                        {formatValue(discount)}
                      </td>
                      <td className="py-3 px-4 text-center">{getScopeBadge(discount.scope)}</td>
                      <td className="py-3 px-4 text-center">
                        {discount.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(discount)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(discount)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación/edición */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Nombre del Descuento"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ej: Descuento hermanos 10%"
          />

          <Select
            label="Tipo de Descuento"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
            required
          >
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto Fijo (S/)</option>
          </Select>

          <Input
            label={formData.type === 'porcentaje' ? 'Porcentaje (%)' : 'Monto (S/)'}
            type="number"
            step={formData.type === 'porcentaje' ? '0.01' : '0.01'}
            min="0"
            max={formData.type === 'porcentaje' ? '100' : undefined}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
            placeholder={formData.type === 'porcentaje' ? '10' : '50.00'}
          />

          <Select
            label="Alcance del Descuento"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value as DiscountScope })}
            required
          >
            <option value="todos">Todos los conceptos</option>
            <option value="pension">Solo pensión</option>
            <option value="matricula">Solo matrícula</option>
            <option value="especifico">Concepto específico</option>
          </Select>

          {formData.scope === 'especifico' && (
            <Select
              label="Concepto Específico"
              value={formData.specific_concept_id}
              onChange={(e) => setFormData({ ...formData, specific_concept_id: e.target.value })}
              required
            >
              <option value="">Selecciona un concepto</option>
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.name}
                </option>
              ))}
            </Select>
          )}

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#1E40AF]">
                <p className="font-medium mb-1">Asignación de descuentos</p>
                <p>
                  Los descuentos se asignan individualmente a cada estudiante desde la sección de
                  "Emisión de Cargos" o desde el perfil del estudiante.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[#3B82F6] border-[#E2E8F0] rounded focus:ring-2 focus:ring-[#3B82F6]"
            />
            <label htmlFor="is_active" className="text-sm text-[#0F172A]">
              Descuento activo
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : editingDiscount ? 'Actualizar' : 'Crear Descuento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Descuento"
      >
        {discountToDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#0F172A] mb-2">
                  ¿Estás seguro de que deseas eliminar el descuento "{discountToDelete.name}"?
                </p>
                <p className="text-sm text-[#64748B]">
                  Esta acción no se puede deshacer. Si este descuento está siendo utilizado por
                  estudiantes, no podrá ser eliminado.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
