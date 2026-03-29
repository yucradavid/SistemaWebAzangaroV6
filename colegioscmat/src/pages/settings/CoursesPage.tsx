import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Filter, Clock } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';


// Paleta de colores distintivos para cursos (Material Design + Tailwind)
const COURSE_PALETTE = [
  '#EF4444', // Red 500
  '#F97316', // Orange 500
  '#F59E0B', // Amber 500
  '#84CC16', // Lime 500
  '#10B981', // Emerald 500
  '#06B6D4', // Cyan 500
  '#3B82F6', // Blue 500
  '#6366F1', // Indigo 500
  '#8B5CF6', // Violet 500
  '#D946EF', // Fuchsia 500
  '#F43F5E', // Rose 500
  '#64748B', // Slate 500
];

interface Course {
  id: string;
  code: string;
  name: string;
  grade_level_id: string;
  hours_per_week: number;
  color?: string; // Nuevo campo opcional
  created_at: string;
  grade_level: {
    level: string;
    grade: number;
    name: string;
  };
}

interface GradeLevel {
  id: string;
  name: string;
  level: string;
  grade: number;
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterGradeId, setFilterGradeId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    grade_level_id: '',
    hours_per_week: 2,
    color: '', // Add color to form state (optional, usually auto-assigned)
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [coursesRes, gradesRes] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            *,
            grade_level:grade_levels(level, grade, name)
          `)
          .order('code', { ascending: true }),
        supabase
          .from('grade_levels')
          .select('*')
          .order('level', { ascending: true })
          .order('grade', { ascending: true }),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (gradesRes.error) throw gradesRes.error;

      setCourses(coursesRes.data || []);
      setGradeLevels(gradesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  // Helper to get next available color
  const getNextAvailableColor = (currentCourses: Course[]) => {
    const usedColors = new Set(currentCourses.map(c => c.color).filter(Boolean));
    // Find first unused color
    const available = COURSE_PALETTE.find(c => !usedColors.has(c));
    if (available) return available;
    // If all used, pick random
    return COURSE_PALETTE[Math.floor(Math.random() * COURSE_PALETTE.length)];
  };

  // Auto-fix colors for all courses
  async function handleAutoAssignColors() {
    if (!confirm('¿Deseas reasignar automáticamente los colores a TODOS los cursos para asegurar que sean distintivos?')) return;

    try {
      setLoading(true);
      let colorIndex = 0;
      const updates = courses.map(course => {
        const color = COURSE_PALETTE[colorIndex % COURSE_PALETTE.length];
        colorIndex++;
        return supabase
          .from('courses')
          .update({ color: color } as never)
          .eq('id', course.id);
      });

      await Promise.all(updates);
      await loadData();
      alert('Colores reasignados correctamente');
    } catch (err) {
      console.error('Error auto-assigning colors:', err);
      setError('Error al asignar colores');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      grade_level_id: '',
      hours_per_week: 2,
      color: '',
    });
    setModalOpen(true);
    setError(null);
  }

  function openEditModal(course: Course) {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      grade_level_id: course.grade_level_id,
      hours_per_week: course.hours_per_week,
      color: course.color || '',
    });
    setModalOpen(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.grade_level_id) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setSaving(true);

      const colorToAssign = formData.color || getNextAvailableColor(courses);

      if (editingCourse) {
        // update with color
        const { error } = await supabase
          .from('courses')
          .update({
            code: formData.code.toUpperCase(),
            name: formData.name,
            grade_level_id: formData.grade_level_id,
            hours_per_week: formData.hours_per_week,
            color: colorToAssign,
          } as never)
          .eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        // insert with color
        const { error } = await supabase
          .from('courses')
          .insert({
            code: formData.code.toUpperCase(),
            name: formData.name,
            grade_level_id: formData.grade_level_id,
            hours_per_week: formData.hours_per_week,
            color: colorToAssign,
          } as never);
        if (error) throw error;
      }
      // ... success
    } catch (err) {
      // ... error handling
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    if (!confirm(`¿Estás seguro de eliminar el curso "${course.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting course:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar este curso porque tiene competencias o registros asociados');
      } else {
        alert('Error al eliminar el curso');
      }
    }
  }



  if (loading) {
    return <Loading fullScreen text="Cargando cursos..." />;
  }

  const filteredCourses = filterGradeId === 'all'
    ? courses
    : courses.filter((c) => c.grade_level_id === filterGradeId);

  const coursesByGrade = filteredCourses.reduce((acc, course) => {
    const key = course.grade_level_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Cursos</h1>
          <p className="text-[#334155]">Gestiona los cursos y sus colores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoAssignColors} icon={<Filter className="w-4 h-4" />}>
            Reasignar Colores
          </Button>
          <Button onClick={openCreateModal} icon={<Plus />}>
            Nuevo curso
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-[#334155]" />
            <Select
              label=""
              value={filterGradeId}
              onChange={(e) => setFilterGradeId(e.target.value)}
              className="flex-1"
            >
              <option value="all">Todos los grados</option>
              {gradeLevels.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Cards Loop */}
      {Object.entries(coursesByGrade).map(([gradeId, gradeCourses]) => {
        const grade = gradeLevels.find((g) => g.id === gradeId);
        if (!grade) return null;

        return (
          <div key={gradeId} className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A] pl-1 border-l-4 border-blue-500">{grade.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gradeCourses.map((course) => (
                <Card key={course.id} variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: course.color || '#3B82F6',
                            boxShadow: `0 4px 12px ${course.color}40`
                          }}
                        >
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-sm mb-1">
                            {course.code}
                          </span>
                          <h3 className="text-lg font-bold text-[#0F172A] leading-tight mt-1">
                            {course.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-700">
                        {course.hours_per_week} {course.hours_per_week === 1 ? 'hora' : 'horas'}
                      </span>
                      <span className="text-slate-400">/ semana</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => openEditModal(course)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(course)}
                        className="px-3"
                      >
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay cursos registrados
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando los cursos para cada grado
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear curso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCourse ? 'Editar curso' : 'Nuevo curso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Input
            label="Código del curso"
            placeholder="MAT-101"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            maxLength={20}
          />

          <Input
            label="Nombre del curso"
            placeholder="Matemáticas, Comunicación, etc."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Grado"
            value={formData.grade_level_id}
            onChange={(e) => setFormData({ ...formData, grade_level_id: e.target.value })}
            required
          >
            <option value="">Seleccionar grado</option>
            {gradeLevels.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            label="Horas por semana"
            placeholder="2"
            value={formData.hours_per_week}
            onChange={(e) => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) })}
            required
            min={1}
            max={40}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Color del curso</label>
            <div className="grid grid-cols-6 gap-2">
              {COURSE_PALETTE.map((color) => {
                // Check if color is used by another course in the SAME grade
                const isUsed = courses.some(c =>
                  c.grade_level_id === formData.grade_level_id && // Same grade
                  c.color === color && // Same color
                  c.id !== editingCourse?.id // Not the current course (if editing)
                );

                const isSelected = formData.color === color;

                return (
                  <button
                    key={color}
                    type="button"
                    disabled={isUsed}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`
                      w-8 h-8 rounded-full transition-all flex items-center justify-center
                      ${isSelected ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}
                      ${isUsed ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-110 cursor-pointer'}
                    `}
                    style={{ backgroundColor: color }}
                    title={isUsed ? 'Color ya asignado en este grado' : 'Seleccionar color'}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </button>
                );
              })}
            </div>
            {formData.color && (
              <p className="text-xs text-slate-500 mt-1">
                Color seleccionado: <span className="inline-block w-3 h-3 rounded-full align-middle ml-1" style={{ backgroundColor: formData.color }}></span>
              </p>
            )}
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
              {saving ? <Loading size="sm" /> : (editingCourse ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
