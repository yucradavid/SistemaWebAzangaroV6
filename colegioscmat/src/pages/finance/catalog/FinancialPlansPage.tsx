import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';

interface AcademicYear {
  id: string;
  year: number;
}

interface FeeConcept {
  id: string;
  name: string;
  type: string;
  base_amount: number;
}

interface PlanInstallment {
  id?: string;
  plan_id?: string;
  installment_number: number;
  due_date: string;
  amount: number;
}

interface FinancialPlan {
  id: string;
  name: string;
  academic_year_id: string;
  concept_id: string;
  number_of_installments: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  academic_year?: AcademicYear;
  fee_concept?: FeeConcept;
  plan_installments?: PlanInstallment[];
}

export function FinancialPlansPage() {
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [concepts, setConcepts] = useState<FeeConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [installmentsModalOpen, setInstallmentsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FinancialPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<FinancialPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<FinancialPlan | null>(null);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    academic_year_id: '',
    concept_id: '',
    number_of_installments: '1',
    is_active: true,
  });
  const [installments, setInstallments] = useState<PlanInstallment[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [plansRes, yearsRes, conceptsRes] = await Promise.all([
        supabase
          .from('financial_plans')
          .select(`
            *,
            academic_year:academic_years(id, year),
            fee_concept:fee_concepts(id, name, type, base_amount)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('academic_years')
          .select('id, year')
          .order('year', { ascending: false }),
        supabase
          .from('fee_concepts')
          .select('id, name, type, base_amount')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (conceptsRes.error) throw conceptsRes.error;

      setPlans(plansRes.data || []);
      setAcademicYears(yearsRes.data || []);
      setConcepts(conceptsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPlan(null);
    setFormData({
      name: '',
      academic_year_id: '',
      concept_id: '',
      number_of_installments: '1',
      is_active: true,
    });
    setInstallments([]);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(plan: FinancialPlan) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      academic_year_id: plan.academic_year_id,
      concept_id: plan.concept_id,
      number_of_installments: plan.number_of_installments.toString(),
      is_active: plan.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  async function openInstallmentsModal(plan: FinancialPlan) {
    try {
      const { data, error } = await supabase
        .from('plan_installments')
        .select('*')
        .eq('plan_id', plan.id)
        .order('installment_number');

      if (error) throw error;

      setViewingPlan(plan);
      setInstallments(data || []);
      setInstallmentsModalOpen(true);
    } catch (error: any) {
      console.error('Error loading installments:', error);
      alert('Error al cargar las cuotas');
    }
  }

  function openDeleteModal(plan: FinancialPlan) {
    setPlanToDelete(plan);
    setDeleteModalOpen(true);
  }

  function generateInstallments() {
    const numInstallments = parseInt(formData.number_of_installments);
    if (isNaN(numInstallments) || numInstallments < 1) {
      setError('El número de cuotas debe ser al menos 1');
      return;
    }

    const concept = concepts.find((c) => c.id === formData.concept_id);
    if (!concept) {
      setError('Selecciona un concepto primero');
      return;
    }

    const amountPerInstallment = concept.base_amount / numInstallments;
    const today = new Date();
    const newInstallments: PlanInstallment[] = [];

    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i);

      newInstallments.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: Math.round(amountPerInstallment * 100) / 100,
      });
    }

    setInstallments(newInstallments);
  }

  function updateInstallment(index: number, field: 'due_date' | 'amount', value: string) {
    const updated = [...installments];
    if (field === 'due_date') {
      updated[index].due_date = value;
    } else {
      updated[index].amount = parseFloat(value) || 0;
    }
    setInstallments(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.academic_year_id || !formData.concept_id) {
      setError('Año académico y concepto son obligatorios');
      return;
    }

    const numInstallments = parseInt(formData.number_of_installments);
    if (isNaN(numInstallments) || numInstallments < 1) {
      setError('El número de cuotas debe ser al menos 1');
      return;
    }

    if (installments.length !== numInstallments) {
      setError('Debes generar las cuotas antes de guardar');
      return;
    }

    // Validar que todas las cuotas tengan fecha y monto válido
    for (let i = 0; i < installments.length; i++) {
      if (!installments[i].due_date) {
        setError(`La cuota ${i + 1} requiere una fecha de vencimiento`);
        return;
      }
      if (installments[i].amount <= 0) {
        setError(`La cuota ${i + 1} requiere un monto válido`);
        return;
      }
    }

    try {
      setSaving(true);

      const planData = {
        name: formData.name.trim(),
        academic_year_id: formData.academic_year_id,
        concept_id: formData.concept_id,
        number_of_installments: numInstallments,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingPlan) {
        // Actualizar plan existente
        const { error: updateError } = await supabase
          .from('financial_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (updateError) throw updateError;

        // Eliminar cuotas existentes
        const { error: deleteError } = await supabase
          .from('plan_installments')
          .delete()
          .eq('plan_id', editingPlan.id);

        if (deleteError) throw deleteError;

        // Insertar nuevas cuotas
        const installmentsData = installments.map((inst) => ({
          plan_id: editingPlan.id,
          installment_number: inst.installment_number,
          due_date: inst.due_date,
          amount: inst.amount,
        }));

        const { error: insertError } = await supabase
          .from('plan_installments')
          .insert(installmentsData);

        if (insertError) throw insertError;
      } else {
        // Crear nuevo plan
        const { data: newPlan, error: insertError } = await supabase
          .from('financial_plans')
          .insert([planData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Insertar cuotas
        const installmentsData = installments.map((inst) => ({
          plan_id: newPlan.id,
          installment_number: inst.installment_number,
          due_date: inst.due_date,
          amount: inst.amount,
        }));

        const { error: insertInstError } = await supabase
          .from('plan_installments')
          .insert(installmentsData);

        if (insertInstError) throw insertInstError;
      }

      setModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      setError(error.message || 'Error al guardar el plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!planToDelete) return;

    try {
      // Primero eliminar cuotas
      const { error: deleteInstError } = await supabase
        .from('plan_installments')
        .delete()
        .eq('plan_id', planToDelete.id);

      if (deleteInstError) throw deleteInstError;

      // Luego eliminar plan
      const { error } = await supabase
        .from('financial_plans')
        .delete()
        .eq('id', planToDelete.id);

      if (error) {
        if (error.code === '23503') {
          alert('No se puede eliminar este plan porque está siendo utilizado en cargos.');
        } else {
          throw error;
        }
      } else {
        setDeleteModalOpen(false);
        setPlanToDelete(null);
        loadData();
      }
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      alert('Error al eliminar el plan');
    }
  }

  const filteredPlans = plans.filter((plan) => {
    if (filterYear !== 'all' && plan.academic_year_id !== filterYear) return false;
    if (filterActive === 'active' && !plan.is_active) return false;
    if (filterActive === 'inactive' && plan.is_active) return false;
    return true;
  });

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.is_active).length,
    currentYear: plans.filter(
      (p) =>
        p.is_active &&
        p.academic_year?.year === new Date().getFullYear()
    ).length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Planes Financieros</h1>
          <p className="text-[#334155] mt-1">Gestiona los planes de pago por cuotas</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Total Planes</p>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#3B82F6]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Planes Activos</p>
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
                <p className="text-sm text-[#64748B]">Año Actual</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.currentYear}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Año Académico"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">Todos</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
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

      {/* Lista de planes */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#0F172A]">Planes ({filteredPlans.length})</h2>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">No hay planes registrados</p>
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
                      Año
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Concepto
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Cuotas
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
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#0F172A]">{plan.name}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#64748B]">
                        {plan.academic_year?.year}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">
                            {plan.fee_concept?.name}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            S/ {plan.fee_concept?.base_amount.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="info">{plan.number_of_installments} cuotas</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {plan.is_active ? (
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
                            onClick={() => openInstallmentsModal(plan)}
                            title="Ver cuotas"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(plan)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteModal(plan)}>
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
        title={editingPlan ? 'Editar Plan' : 'Nuevo Plan Financiero'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Nombre del Plan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ej: Plan Pensión 2025 - 10 cuotas"
          />

          <Select
            label="Año Académico"
            value={formData.academic_year_id}
            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
            required
          >
            <option value="">Selecciona un año</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </Select>

          <Select
            label="Concepto de Cobro"
            value={formData.concept_id}
            onChange={(e) => setFormData({ ...formData, concept_id: e.target.value })}
            required
          >
            <option value="">Selecciona un concepto</option>
            {concepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.name} - S/ {concept.base_amount.toFixed(2)}
              </option>
            ))}
          </Select>

          <div>
            <Input
              label="Número de Cuotas"
              type="number"
              min="1"
              max="12"
              value={formData.number_of_installments}
              onChange={(e) =>
                setFormData({ ...formData, number_of_installments: e.target.value })
              }
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateInstallments}
              className="mt-2"
            >
              Generar Cuotas
            </Button>
          </div>

          {installments.length > 0 && (
            <div className="border border-[#E2E8F0] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-3">Detalle de Cuotas</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {installments.map((inst, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm text-[#64748B]">Cuota {inst.installment_number}</span>
                    <Input
                      type="date"
                      value={inst.due_date}
                      onChange={(e) => updateInstallment(index, 'due_date', e.target.value)}
                      size="sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inst.amount}
                      onChange={(e) => updateInstallment(index, 'amount', e.target.value)}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total:</span>
                  <span>
                    S/ {installments.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[#3B82F6] border-[#E2E8F0] rounded focus:ring-2 focus:ring-[#3B82F6]"
            />
            <label htmlFor="is_active" className="text-sm text-[#0F172A]">
              Plan activo
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : editingPlan ? 'Actualizar' : 'Crear Plan'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de ver cuotas */}
      <Modal
        isOpen={installmentsModalOpen}
        onClose={() => setInstallmentsModalOpen(false)}
        title={`Cuotas: ${viewingPlan?.name}`}
      >
        {viewingPlan && (
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#64748B]">Año Académico</p>
                  <p className="font-semibold text-[#0F172A]">
                    {viewingPlan.academic_year?.year}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Concepto</p>
                  <p className="font-semibold text-[#0F172A]">
                    {viewingPlan.fee_concept?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Monto Total</p>
                  <p className="font-semibold text-[#0F172A]">
                    S/ {viewingPlan.fee_concept?.base_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Número de Cuotas</p>
                  <p className="font-semibold text-[#0F172A]">
                    {viewingPlan.number_of_installments}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-[#0F172A]">
                      Cuota
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-[#0F172A]">
                      Vencimiento
                    </th>
                    <th className="text-right py-2 px-4 text-sm font-semibold text-[#0F172A]">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst) => (
                    <tr key={inst.id} className="border-t border-[#E2E8F0]">
                      <td className="py-2 px-4 text-sm text-[#0F172A]">
                        Cuota {inst.installment_number}
                      </td>
                      <td className="py-2 px-4 text-sm text-[#64748B]">
                        {new Date(inst.due_date + 'T00:00:00').toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-2 px-4 text-sm text-right font-semibold text-[#0F172A]">
                        S/ {inst.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                  <tr>
                    <td colSpan={2} className="py-2 px-4 text-sm font-semibold text-[#0F172A]">
                      Total
                    </td>
                    <td className="py-2 px-4 text-sm text-right font-bold text-[#0F172A]">
                      S/ {installments.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <Button
              variant="outline"
              onClick={() => setInstallmentsModalOpen(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Plan"
      >
        {planToDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#0F172A] mb-2">
                  ¿Estás seguro de que deseas eliminar el plan "{planToDelete.name}"?
                </p>
                <p className="text-sm text-[#64748B]">
                  Esta acción eliminará el plan y todas sus cuotas. Si este plan está siendo
                  utilizado en cargos, no podrá ser eliminado.
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
