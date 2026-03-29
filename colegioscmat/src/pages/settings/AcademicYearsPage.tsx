import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

interface AcademicYear {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    is_active: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setYears(data || []);
    } catch (error) {
      console.error('Error loading academic years:', error);
      setError('Error al cargar los años lectivos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingYear(null);
    setFormData({
      year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      is_active: false,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(year: AcademicYear) {
    setEditingYear(year);
    setFormData({
      year: year.year,
      start_date: year.start_date,
      end_date: year.end_date,
      is_active: year.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      setError('El año debe estar entre 2000 y 2100');
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

      if (editingYear) {
        // Actualizar
        const { error } = await supabase
          .from('academic_years')
          .update({
            year: formData.year,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
          } as never)
          .eq('id', editingYear.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('academic_years')
          .insert({
            year: formData.year,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
          } as never);

        if (error) throw error;
      }

      setModalOpen(false);
      loadYears();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error saving academic year:', error);
      if (error.code === '23505') {
        setError('Ya existe un año lectivo con ese año');
      } else {
        setError('Error al guardar el año lectivo');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(year: AcademicYear) {
    if (!confirm(`¿Estás seguro de eliminar el año lectivo ${year.year}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', year.id);

      if (error) throw error;
      loadYears();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting academic year:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar este año lectivo porque tiene periodos o registros asociados');
      } else {
        alert('Error al eliminar el año lectivo');
      }
    }
  }

  async function toggleActive(year: AcademicYear) {
    try {
      // Si se va a activar, desactivar todos los demás primero
      if (!year.is_active) {
        await supabase
          .from('academic_years')
          .update({ is_active: false } as never)
          .neq('id', year.id);
      }

      const { error } = await supabase
        .from('academic_years')
        .update({ is_active: !year.is_active } as never)
        .eq('id', year.id);

      if (error) throw error;
      loadYears();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Error al cambiar el estado activo');
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando años lectivos..." />;
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Años Lectivos</h1>
          <p className="text-[#334155]">Gestiona los años académicos de la institución</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus />}>
          Nuevo año lectivo
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((year) => (
          <Card key={year.id} variant="elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F172A]">{year.year}</h3>
                    {year.is_active && (
                      <Badge variant="success" size="sm">Activo</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#334155]">Fecha de inicio</p>
                  <p className="font-medium text-[#0F172A]">
                    {new Date(year.start_date).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#334155]">Fecha de fin</p>
                  <p className="font-medium text-[#0F172A]">
                    {new Date(year.end_date).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#CBD5E1] flex gap-2">
                  <Button
                    size="sm"
                    variant={year.is_active ? 'outline' : 'secondary'}
                    fullWidth
                    onClick={() => toggleActive(year)}
                  >
                    {year.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Edit2 className="w-4 h-4" />}
                    onClick={() => openEditModal(year)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(year)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {years.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay años lectivos registrados
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando el primer año lectivo de la institución
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear año lectivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingYear ? 'Editar año lectivo' : 'Nuevo año lectivo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Input
            type="number"
            label="Año"
            placeholder="2025"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
            min={2000}
            max={2100}
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
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-[#CBD5E1]"
            />
            <label htmlFor="is_active" className="text-sm text-[#334155] cursor-pointer">
              Marcar como año activo (se desactivarán los demás años)
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
              {saving ? <Loading size="sm" /> : (editingYear ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
