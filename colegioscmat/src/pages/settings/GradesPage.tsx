import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

interface GradeLevel {
  id: string;
  level: 'inicial' | 'primaria' | 'secundaria';
  grade: number;
  name: string;
  created_at: string;
}

const EDUCATION_LEVELS = [
  { value: 'inicial', label: 'Inicial' },
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
];

export function GradesPage() {
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeLevel | null>(null);
  const [formData, setFormData] = useState({
    level: 'primaria' as 'inicial' | 'primaria' | 'secundaria',
    grade: 1,
    name: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grade_levels')
        .select('*')
        .order('level', { ascending: true })
        .order('grade', { ascending: true });

      if (error) throw error;
      setGrades(data || []);
    } catch (error) {
      console.error('Error loading grades:', error);
      setError('Error al cargar los grados');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingGrade(null);
    setFormData({
      level: 'primaria',
      grade: 1,
      name: '',
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(grade: GradeLevel) {
    setEditingGrade(grade);
    setFormData({
      level: grade.level,
      grade: grade.grade,
      name: grade.name,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.grade) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setSaving(true);

      if (editingGrade) {
        const { error } = await supabase
          .from('grade_levels')
          .update({
            level: formData.level,
            grade: formData.grade,
            name: formData.name,
          } as never)
          .eq('id', editingGrade.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('grade_levels')
          .insert({
            level: formData.level,
            grade: formData.grade,
            name: formData.name,
          } as never);

        if (error) throw error;
      }

      setModalOpen(false);
      loadGrades();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error saving grade:', error);
      if (error.code === '23505') {
        setError('Ya existe un grado con ese nivel y número');
      } else {
        setError('Error al guardar el grado');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(grade: GradeLevel) {
    if (!confirm(`¿Estás seguro de eliminar el grado "${grade.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grade_levels')
        .delete()
        .eq('id', grade.id);

      if (error) throw error;
      loadGrades();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting grade:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar este grado porque tiene secciones o cursos asociados');
      } else {
        alert('Error al eliminar el grado');
      }
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando grados..." />;
  }

  const gradesByLevel = grades.reduce((acc, grade) => {
    if (!acc[grade.level]) acc[grade.level] = [];
    acc[grade.level].push(grade);
    return acc;
  }, {} as Record<string, GradeLevel[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Grados y Niveles</h1>
          <p className="text-[#334155]">Gestiona los grados por nivel educativo</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus />}>
          Nuevo grado
        </Button>
      </div>

      {EDUCATION_LEVELS.map(({ value, label }) => {
        const levelGrades = gradesByLevel[value] || [];
        if (levelGrades.length === 0) return null;

        return (
          <div key={value} className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              {label}
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {levelGrades.map((grade) => (
                <Card key={grade.id} variant="elevated">
                  <CardHeader>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-full flex items-center justify-center mb-3">
                        <span className="text-3xl font-bold text-white">{grade.grade}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">{grade.name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => openEditModal(grade)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(grade)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {grades.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay grados registrados
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando los grados por nivel educativo
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear grado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGrade ? 'Editar grado' : 'Nuevo grado'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Select
            label="Nivel educativo"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
            required
          >
            {EDUCATION_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            label="Número de grado"
            placeholder="1, 2, 3..."
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
            required
            min={1}
            max={6}
          />

          <Input
            label="Nombre del grado"
            placeholder="Ej: 1ro Primaria, 5to Secundaria"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

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
              {saving ? <Loading size="sm" /> : (editingGrade ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
