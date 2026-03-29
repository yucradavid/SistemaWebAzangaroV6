import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

interface Competency {
  id: string;
  course_id: string;
  code: string;
  description: string;
  order_index: number;
  created_at: string;
  course: {
    code: string;
    name: string;
    grade_level: {
      name: string;
    };
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
  grade_level: {
    name: string;
  };
}

export function CompetenciesPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    code: '',
    description: '',
    order_index: 1,
  });
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [competenciesRes, coursesRes] = await Promise.all([
        supabase
          .from('competencies')
          .select(`
            *,
            course:courses(
              code,
              name,
              grade_level:grade_levels(name)
            )
          `)
          .order('order_index', { ascending: true }),
        supabase
          .from('courses')
          .select(`
            *,
            grade_level:grade_levels(name)
          `)
          .order('code', { ascending: true }),
      ]);

      if (competenciesRes.error) throw competenciesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setCompetencies(competenciesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCompetency(null);
    setFormData({
      course_id: filterCourseId !== 'all' ? filterCourseId : '',
      code: '',
      description: '',
      order_index: 1,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(competency: Competency) {
    setEditingCompetency(competency);
    setFormData({
      course_id: competency.course_id,
      code: competency.code,
      description: competency.description,
      order_index: competency.order_index,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.course_id || !formData.code || !formData.description) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.order_index < 1 || formData.order_index > 100) {
      setError('El orden debe estar entre 1 y 100');
      return;
    }

    try {
      setSaving(true);

      if (editingCompetency) {
        const { error } = await supabase
          .from('competencies')
          .update({
            course_id: formData.course_id,
            code: formData.code.toUpperCase(),
            description: formData.description,
            order_index: formData.order_index,
          } as never)
          .eq('id', editingCompetency.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('competencies')
          .insert({
            course_id: formData.course_id,
            code: formData.code.toUpperCase(),
            description: formData.description,
            order_index: formData.order_index,
          } as never);

        if (error) throw error;
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error saving competency:', error);
      if (error.code === '23505') {
        setError('Ya existe una competencia con ese código para este curso');
      } else {
        setError('Error al guardar la competencia');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(competency: Competency) {
    if (!confirm(`¿Estás seguro de eliminar la competencia "${competency.code}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('competencies')
        .delete()
        .eq('id', competency.id);

      if (error) throw error;
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting competency:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar esta competencia porque tiene registros asociados');
      } else {
        alert('Error al eliminar la competencia');
      }
    }
  }

  async function moveCompetency(competency: Competency, direction: 'up' | 'down') {
    const newOrder = direction === 'up' ? competency.order_index - 1 : competency.order_index + 1;

    try {
      const { error } = await supabase
        .from('competencies')
        .update({ order_index: newOrder } as never)
        .eq('id', competency.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error moving competency:', error);
      alert('Error al reordenar la competencia');
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando competencias..." />;
  }

  const filteredCompetencies = filterCourseId === 'all'
    ? competencies
    : competencies.filter((c) => c.course_id === filterCourseId);

  const competenciesByCourse = filteredCompetencies.reduce((acc, competency) => {
    const key = competency.course_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(competency);
    return acc;
  }, {} as Record<string, Competency[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Competencias</h1>
          <p className="text-[#334155]">Gestiona las competencias por curso</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus />}>
          Nueva competencia
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-[#334155]" />
            <Select
              label=""
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="flex-1"
            >
              <option value="all">Todos los cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.grade_level.name})
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {Object.entries(competenciesByCourse).map(([courseId, courseCompetencies]) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return null;

        return (
          <div key={courseId} className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">
              {course.code} - {course.name}
              <span className="text-sm font-normal text-[#334155] ml-2">
                ({course.grade_level.name})
              </span>
            </h2>
            <div className="space-y-3">
              {courseCompetencies.map((competency, index) => (
                <Card key={competency.id} variant="elevated">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ArrowUp className="w-4 h-4" />}
                          onClick={() => moveCompetency(competency, 'up')}
                          disabled={index === 0}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ArrowDown className="w-4 h-4" />}
                          onClick={() => moveCompetency(competency, 'down')}
                          disabled={index === courseCompetencies.length - 1}
                        />
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">
                          {competency.order_index}
                        </span>
                      </div>
                      <div className="flex-1">
                        <Badge variant="primary" className="mb-2">
                          {competency.code}
                        </Badge>
                        <p className="text-[#0F172A]">{competency.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Edit2 className="w-4 h-4" />}
                          onClick={() => openEditModal(competency)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDelete(competency)}
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
        );
      })}

      {filteredCompetencies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Target className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay competencias registradas
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando las competencias para cada curso
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear competencia
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCompetency ? 'Editar competencia' : 'Nueva competencia'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Select
            label="Curso"
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            required
          >
            <option value="">Seleccionar curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name} ({course.grade_level.name})
              </option>
            ))}
          </Select>

          <Input
            label="Código de la competencia"
            placeholder="C1, C2, C3..."
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            maxLength={20}
          />

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Descripción
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:border-[#0E3A8A] focus:outline-none"
              rows={4}
              placeholder="Describe la competencia..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <Input
            type="number"
            label="Orden"
            placeholder="1"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
            required
            min={1}
            max={100}
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
              {saving ? <Loading size="sm" /> : (editingCompetency ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
