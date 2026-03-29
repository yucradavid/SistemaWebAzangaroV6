import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Filter } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

interface Section {
  id: string;
  academic_year_id: string;
  grade_level_id: string;
  section_letter: string;
  capacity: number;
  created_at: string;
  grade_level: {
    level: string;
    grade: number;
    name: string;
  };
  academic_year: {
    year: number;
  };
}

interface AcademicYear {
  id: string;
  year: number;
  is_active: boolean;
}

interface GradeLevel {
  id: string;
  level: string;
  grade: number;
  name: string;
}

export function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    academic_year_id: '',
    grade_level_id: '',
    section_letter: '',
    capacity: 30,
  });
  const [filterGradeId, setFilterGradeId] = useState<string>('all');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [sectionsRes, yearsRes, gradesRes] = await Promise.all([
        supabase
          .from('sections')
          .select(`
            *,
            grade_level:grade_levels(level, grade, name),
            academic_year:academic_years(year)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('academic_years')
          .select('*')
          .order('year', { ascending: false }),
        supabase
          .from('grade_levels')
          .select('*')
          .order('level', { ascending: true })
          .order('grade', { ascending: true }),
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (gradesRes.error) throw gradesRes.error;

      setSections(sectionsRes.data || []);
      setAcademicYears(yearsRes.data || []);
      setGradeLevels(gradesRes.data || []);

      if (yearsRes.data && yearsRes.data.length > 0) {
        const activeYear = yearsRes.data.find((y) => y.is_active);
        setFormData((prev) => ({
          ...prev,
          academic_year_id: activeYear ? activeYear.id : yearsRes.data[0].id,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSection(null);
    setFormData({
      academic_year_id: academicYears.find((y) => y.is_active)?.id || academicYears[0]?.id || '',
      grade_level_id: '',
      section_letter: '',
      capacity: 30,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(section: Section) {
    setEditingSection(section);
    setFormData({
      academic_year_id: section.academic_year_id,
      grade_level_id: section.grade_level_id,
      section_letter: section.section_letter,
      capacity: section.capacity,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.academic_year_id || !formData.grade_level_id || !formData.section_letter) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.capacity < 1 || formData.capacity > 100) {
      setError('La capacidad debe estar entre 1 y 100 estudiantes');
      return;
    }

    try {
      setSaving(true);

      if (editingSection) {
        const { error } = await supabase
          .from('sections')
          .update({
            academic_year_id: formData.academic_year_id,
            grade_level_id: formData.grade_level_id,
            section_letter: formData.section_letter.toUpperCase(),
            capacity: formData.capacity,
          } as never)
          .eq('id', editingSection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sections')
          .insert({
            academic_year_id: formData.academic_year_id,
            grade_level_id: formData.grade_level_id,
            section_letter: formData.section_letter.toUpperCase(),
            capacity: formData.capacity,
          } as never);

        if (error) throw error;
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error saving section:', error);
      if (error.code === '23505') {
        setError('Ya existe una sección con esa letra para este grado y año');
      } else {
        setError('Error al guardar la sección');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(section: Section) {
    if (!confirm(`¿Estás seguro de eliminar la sección "${section.section_letter}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', section.id);

      if (error) throw error;
      loadData();
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Error deleting section:', error);
      if (error.code === '23503') {
        alert('No se puede eliminar esta sección porque tiene estudiantes matriculados');
      } else {
        alert('Error al eliminar la sección');
      }
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando secciones..." />;
  }

  const filteredSections = filterGradeId === 'all'
    ? sections
    : sections.filter((s) => s.grade_level_id === filterGradeId);

  const sectionsByGrade = filteredSections.reduce((acc, section) => {
    const key = section.grade_level_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(section);
    return acc;
  }, {} as Record<string, Section[]>);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Secciones</h1>
          <p className="text-[#334155]">Gestiona las secciones por grado</p>
        </div>
        <Button onClick={openCreateModal} icon={<Plus />}>
          Nueva sección
        </Button>
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

      {Object.entries(sectionsByGrade).map(([gradeId, gradeSections]) => {
        const grade = gradeLevels.find((g) => g.id === gradeId);
        if (!grade) return null;

        return (
          <div key={gradeId} className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">{grade.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeSections.map((section) => (
                <Card key={section.id} variant="elevated">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {section.section_letter}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#0F172A]">
                            Sección {section.section_letter}
                          </h3>
                          <p className="text-sm text-[#334155]">
                            Año {section.academic_year.year}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-[#334155]" />
                      <span className="text-sm text-[#334155]">
                        Capacidad: {section.capacity} estudiantes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        fullWidth
                        icon={<Edit2 className="w-4 h-4" />}
                        onClick={() => openEditModal(section)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(section)}
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

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay secciones registradas
              </h3>
              <p className="text-[#334155] mb-6">
                Comienza creando las secciones para cada grado
              </p>
              <Button onClick={openCreateModal} icon={<Plus />}>
                Crear sección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSection ? 'Editar sección' : 'Nueva sección'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          <Select
            label="Año académico"
            value={formData.academic_year_id}
            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
            required
          >
            <option value="">Seleccionar año</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name} {year.is_active && '(Activo)'}
              </option>
            ))}
          </Select>

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
            label="Letra de la sección"
            placeholder="A, B, C..."
            value={formData.section_letter}
            onChange={(e) => setFormData({ ...formData, section_letter: e.target.value.toUpperCase() })}
            required
            maxLength={2}
          />

          <Input
            type="number"
            label="Capacidad de estudiantes"
            placeholder="30"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
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
              {saving ? <Loading size="sm" /> : (editingSection ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
