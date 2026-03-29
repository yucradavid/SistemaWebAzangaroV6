import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';

type ConceptType = 'matricula' | 'pension' | 'interes' | 'certificado' | 'taller' | 'servicio' | 'otro';
type ConceptPeriodicity = 'unico' | 'mensual' | 'anual' | 'opcional';

interface FeeConcept {
  id: string;
  name: string;
  type: ConceptType;
  base_amount: number;
  periodicity: ConceptPeriodicity;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function FeeConceptsPage() {
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<FeeConcept | null>(null);
  const [conceptToDelete, setConceptToDelete] = useState<FeeConcept | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'pension' as ConceptType,
    base_amount: '',
    periodicity: 'mensual' as ConceptPeriodicity,
    description: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConcepts();
  }, []);

  async function loadConcepts() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('fee_concepts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConcepts(data || []);
    } catch (error: any) {
      console.error('Error loading concepts:', error);
      setError('Error al cargar los conceptos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingConcept(null);
    setFormData({
      name: '',
      type: 'pension',
      base_amount: '',
      periodicity: 'mensual',
      description: '',
      is_active: true,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(concept: FeeConcept) {
    setEditingConcept(concept);
    setFormData({
      name: concept.name,
      type: concept.type,
      base_amount: concept.base_amount.toString(),
      periodicity: concept.periodicity,
      description: concept.description || '',
      is_active: concept.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  function openDeleteModal(concept: FeeConcept) {
    setConceptToDelete(concept);
    setDeleteModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const amount = parseFloat(formData.base_amount);
    if (isNaN(amount) || amount < 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    try {
      setSaving(true);

      const conceptData = {
        name: formData.name.trim(),
        type: formData.type,
        base_amount: amount,
        periodicity: formData.periodicity,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingConcept) {
        const { error: updateError } = await supabase
          .from('fee_concepts')
          .update(conceptData)
          .eq('id', editingConcept.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('fee_concepts')
          .insert([conceptData]);

        if (insertError) throw insertError;
      }

      setModalOpen(false);
      loadConcepts();
    } catch (error: any) {
      console.error('Error saving concept:', error);
      setError(error.message || 'Error al guardar el concepto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!conceptToDelete) return;

    try {
      const { error } = await supabase
        .from('fee_concepts')
        .delete()
        .eq('id', conceptToDelete.id);

      if (error) {
        // Error FK constraint
        if (error.code === '23503') {
          alert(
            'No se puede eliminar este concepto porque está siendo utilizado en cargos o planes financieros.'
          );
        } else {
          throw error;
        }
      } else {
        setDeleteModalOpen(false);
        setConceptToDelete(null);
        loadConcepts();
      }
    } catch (error: any) {
      console.error('Error deleting concept:', error);
      alert('Error al eliminar el concepto');
    }
  }

  function getTypeBadge(type: ConceptType) {
    const badges: Record<ConceptType, { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'secondary' }> = {
      matricula: { label: 'Matrícula', variant: 'success' },
      pension: { label: 'Pensión', variant: 'info' },
      interes: { label: 'Interés', variant: 'error' },
      certificado: { label: 'Certificado', variant: 'secondary' },
      taller: { label: 'Taller', variant: 'warning' },
      servicio: { label: 'Servicio', variant: 'info' },
      otro: { label: 'Otro', variant: 'secondary' },
    };
    const badge = badges[type];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  }

  function getPeriodicityLabel(periodicity: ConceptPeriodicity): string {
    const labels: Record<ConceptPeriodicity, string> = {
      unico: 'Único',
      mensual: 'Mensual',
      anual: 'Anual',
      opcional: 'Opcional',
    };
    return labels[periodicity];
  }

  const filteredConcepts = concepts.filter((concept) => {
    if (filterType !== 'all' && concept.type !== filterType) return false;
    if (filterActive === 'active' && !concept.is_active) return false;
    if (filterActive === 'inactive' && concept.is_active) return false;
    return true;
  });

  const stats = {
    total: concepts.length,
    active: concepts.filter((c) => c.is_active).length,
    pension: concepts.filter((c) => c.type === 'pension').length,
    matricula: concepts.filter((c) => c.type === 'matricula').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Conceptos de Cobro</h1>
          <p className="text-[#334155] mt-1">Gestiona los conceptos financieros de la institución</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Concepto
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
              <DollarSign className="w-8 h-8 text-[#3B82F6]" />
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
                <p className="text-sm text-[#64748B]">Pensiones</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.pension}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Matrículas</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{stats.matricula}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Filtros</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="matricula">Matrícula</option>
              <option value="pension">Pensión</option>
              <option value="interes">Interés</option>
              <option value="certificado">Certificado</option>
              <option value="taller">Taller</option>
              <option value="servicio">Servicio</option>
              <option value="otro">Otro</option>
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

      {/* Lista de conceptos */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Conceptos ({filteredConcepts.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredConcepts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">No hay conceptos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Nombre
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Tipo
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Monto Base
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Periodicidad
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
                  {filteredConcepts.map((concept) => (
                    <tr key={concept.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-[#0F172A]">{concept.name}</p>
                          {concept.description && (
                            <p className="text-sm text-[#64748B]">{concept.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(concept.type)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#0F172A]">
                        S/ {concept.base_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#64748B]">
                        {getPeriodicityLabel(concept.periodicity)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {concept.is_active ? (
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
                            onClick={() => openEditModal(concept)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(concept)}
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
        title={editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Nombre del Concepto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ej: Pensión Marzo 2025"
          />

          <Select
            label="Tipo de Concepto"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ConceptType })}
            required
          >
            <option value="pension">Pensión</option>
            <option value="matricula">Matrícula</option>
            <option value="interes">Interés/Mora</option>
            <option value="certificado">Certificado</option>
            <option value="taller">Taller</option>
            <option value="servicio">Servicio</option>
            <option value="otro">Otro</option>
          </Select>

          <Input
            label="Monto Base (S/)"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_amount}
            onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
            required
            placeholder="0.00"
          />

          <Select
            label="Periodicidad"
            value={formData.periodicity}
            onChange={(e) =>
              setFormData({ ...formData, periodicity: e.target.value as ConceptPeriodicity })
            }
            required
          >
            <option value="mensual">Mensual</option>
            <option value="unico">Único</option>
            <option value="anual">Anual</option>
            <option value="opcional">Opcional</option>
          </Select>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción adicional del concepto..."
            />
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
              Concepto activo
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : editingConcept ? 'Actualizar' : 'Crear Concepto'}
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
        title="Eliminar Concepto"
      >
        {conceptToDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#0F172A] mb-2">
                  ¿Estás seguro de que deseas eliminar el concepto "{conceptToDelete.name}"?
                </p>
                <p className="text-sm text-[#64748B]">
                  Esta acción no se puede deshacer. Si este concepto está siendo utilizado en
                  cargos o planes financieros, no podrá ser eliminado.
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
