import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

interface Period {
  id: string;
  academic_year_id: string;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  created_at: string;
  academic_year?: {
    year: number;
  };
}

interface AcademicYear {
  id: string;
  year: number;
}

export function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [formData, setFormData] = useState({
    academic_year_id: '',
    name: '',
    period_number: 1,
    start_date: '',
    end_date: '',
    is_closed: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year')
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);

      const { data: periodsData, error: periodsError } = await supabase
        .from('periods')
        .select(`
          *,
          academic_year:academic_years(year)
        `)
        .order('academic_year_id', { ascending: false })
        .order('period_number', { ascending: true });

      if (periodsError) throw periodsError;
      setPeriods(periodsData || []);
    } catch (error) {
      console.error('Error loading periods:', error);
      setError('Error al cargar los periodos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPeriod(null);
    setFormData({
      academic_year_id: academicYears[0]?.id || '',
      name: '',
      period_number: 1,
      start_date: '',
      end_date: '',
      is_closed: false,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(period: Period) {
    setEditingPeriod(period);
    setFormData({
      academic_year_id: period.academic_year_id,
      name: period.name,
      period_number: period.period_number,
      start_date: period.start_date,
      end_date: period.end_date,
      is_closed: period.is_closed,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.academic_year_id) {
      setError('Debes seleccionar un año lectivo');
      return;
    }

    if (!formData.name || !formData.period_number) {
      setError('El nombre y número de periodo son obligatorios');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Las fechas de inicio y fin son obligatorias');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      setSaving(true);

      if (editingPeriod) {
        const { error } = await supabase
          .from('periods')
          .update({
            academic_year_id: formData.academic_year_id,
            name: formData.name,
            period_number: formData.period_number,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_closed: formData.is_closed,
          } as never)
          .eq('id', editingPeriod.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('periods')
          .insert({
            academic_year_id: formData.academic_year_id,
            name: formData.name,
            period_number: formData.period_number,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_closed: formData.is_closed,
          } as never);

        if (error) throw error;
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error saving period:', error);
      if (error.code === '23505') {
        setError('Ya existe un periodo con ese número en este año lectivo');
      } else {
        setError('Error al guardar el periodo');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(period: Period) {
    if (!confirm(`¿Estás seguro de eliminar el periodo "${period.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('periods')
        .delete()
        .eq('id', period.id);

      if (error) throw error;
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting period:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar este periodo porque tiene evaluaciones o registros asociados');
      } else {
        alert('Error al eliminar el periodo');
      }
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando periodos..." />;
  }

  const periodsByYear = periods.reduce((acc, period) => {
    const year = period.academic_year?.year || 'Sin año';
    if (!acc[year]) acc[year] = [];
    acc[year].push(period);
    return acc;
  }, {} as Record<string | number, Period[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Periodos Académicos</h1>
          <p className="text-[#334155]">Gestiona los periodos (bimestres/trimestres) por año lectivo</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus />}>
          Nuevo periodo
        </Button>
      </div>

      {Object.entries(periodsByYear).map(([year, yearPeriods]) => (
        <div key={year} className="space-y-4">
          <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Año {year}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {yearPeriods.map((period) => (
              <Card key={period.id} variant="elevated">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-[#0E3A8A]">
                          {period.period_number}
                        </span>
                        {period.is_closed && (
                          <Badge variant="error" size="sm">Cerrado</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">{period.name}</h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-[#334155]">Inicio</p>
                      <p className="font-medium text-[#0F172A]">
                        {new Date(period.start_date).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#334155]">Fin</p>
                      <p className="font-medium text-[#0F172A]">
                        {new Date(period.end_date).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#CBD5E1] flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => openEditModal(period)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(period)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {periods.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay periodos registrados
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando los periodos académicos (bimestres, trimestres, etc.)
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear periodo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPeriod ? 'Editar periodo' : 'Nuevo periodo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Select
            label="Año lectivo"
            value={formData.academic_year_id}
            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
            required
          >
            <option value="">Seleccionar año</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </Select>

          <Input
            label="Nombre del periodo"
            placeholder="Ej: Bimestre I, Trimestre 1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            type="number"
            label="Número de periodo"
            placeholder="1, 2, 3, 4..."
            value={formData.period_number}
            onChange={(e) => setFormData({ ...formData, period_number: parseInt(e.target.value) })}
            required
            min={1}
            max={12}
          />

          <Input
            type="date"
            label="Fecha de inicio"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />

          <Input
            type="date"
            label="Fecha de fin"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />

          <div className="flex items-center gap-3 p-4 bg-[#F1F5F9] rounded-xl">
            <input
              type="checkbox"
              id="is_closed"
              checked={formData.is_closed}
              onChange={(e) => setFormData({ ...formData, is_closed: e.target.checked })}
              className="w-5 h-5 rounded border-[#CBD5E1]"
            />
            <label htmlFor="is_closed" className="text-sm text-[#334155] cursor-pointer">
              Marcar periodo como cerrado (no se podrán registrar calificaciones)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? <Loading size="sm" /> : (editingPeriod ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
