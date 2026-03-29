import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Users, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_assignments: number;
}

interface Section {
  id: string;
  section_letter: string;
  grade_level_id: string;
  grade_levels: {
    name: string;
    level: string;
    grade: number;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Assignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  section_id: string;
  section_name: string;
  grade_level_name: string;
  course_id: string;
  course_name: string;
  student_count: number;
}

export function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');

  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Obtener año académico activo
      const { data: yearData, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;
      setAcademicYearId(yearData.id);

      // Cargar docentes con conteo de asignaciones
      await loadTeachers(yearData.id);

      // Cargar secciones
      await loadSections();

      // Cargar cursos
      await loadCourses();

      // Cargar asignaciones actuales
      await loadAssignments(yearData.id);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers(yearId: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        first_name,
        last_name,
        email
      `)
      .eq('status', 'active')
      .order('last_name');

    if (error) throw error;

    // Contar asignaciones por docente
    const teachersWithCounts = await Promise.all(
      (data || []).map(async (teacher: any) => {
        const { count } = await supabase
          .from('teacher_course_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacher.id)
          .eq('academic_year_id', yearId)
          .eq('is_active', true);

        return {
          id: teacher.id,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          email: teacher.email,
          current_assignments: count || 0,
        };
      })
    );

    setTeachers(teachersWithCounts);
  }

  async function loadSections() {
    const { data, error } = await supabase
      .from('sections')
      .select(`
        id,
        section_letter,
        grade_level_id,
        grade_levels!inner(name, level, grade)
      `)
      .order('grade_levels(grade)');

    if (error) throw error;
    setSections(data || []);
  }

  async function loadCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, code')
      .order('name');

    if (error) throw error;
    setCourses(data || []);
  }

  async function loadAssignments(yearId: string) {
    const { data, error } = await supabase
      .from('teacher_assignments_view')
      .select('*')
      .eq('academic_year_id', yearId)
      .order('teacher_name');

    if (error) throw error;

    const formattedData = (data || []).map((a: any) => ({
      id: a.id,
      teacher_id: a.teacher_id,
      teacher_name: a.teacher_name,
      section_id: a.section_id,
      section_name: a.section_name,
      grade_level_name: a.grade_level_name,
      course_id: a.course_id,
      course_name: a.course_name,
      student_count: a.student_count || 0,
    }));

    setAssignments(formattedData);
  }

  async function handleCreateAssignment() {
    if (!selectedTeacher || !selectedSection || !selectedCourse) {
      setError('Debes seleccionar docente, sección y curso');
      return;
    }

    // Validar que el docente no tenga más de 6 cursos
    const teacher = teachers.find(t => t.id === selectedTeacher);
    if (teacher && teacher.current_assignments >= 6) {
      setError(`El docente ya tiene ${teacher.current_assignments} cursos asignados. Máximo permitido: 6`);
      return;
    }

    // Validar que no exista la asignación
    const exists = assignments.some(
      a => a.teacher_id === selectedTeacher &&
        a.section_id === selectedSection &&
        a.course_id === selectedCourse
    );

    if (exists) {
      setError('Esta asignación ya existe');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('teacher_course_assignments')
        .insert({
          teacher_id: selectedTeacher,
          section_id: selectedSection,
          course_id: selectedCourse,
          academic_year_id: academicYearId,
          assigned_by: user?.id,
          is_active: true,
        });

      if (insertError) throw insertError;

      // Recargar datos
      await loadTeachers(academicYearId);
      await loadAssignments(academicYearId);

      // Limpiar formulario
      setSelectedTeacher('');
      setSelectedSection('');
      setSelectedCourse('');

      alert('Asignación creada exitosamente');
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.message || 'Error al crear la asignación');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string, teacherId: string) {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('teacher_course_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      // Recargar datos
      await loadTeachers(academicYearId);
      await loadAssignments(academicYearId);

      alert('Asignación eliminada');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert('Error al eliminar la asignación');
    }
  }

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
  const canAddMore = !selectedTeacherData || selectedTeacherData.current_assignments < 6;

  // Agrupar asignaciones por docente
  const assignmentsByTeacher = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.teacher_id]) {
      acc[assignment.teacher_id] = {
        teacher_name: assignment.teacher_name,
        assignments: [],
      };
    }
    acc[assignment.teacher_id].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { teacher_name: string; assignments: Assignment[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asignación de Cursos</h1>
              <p className="text-gray-600">Asigna cursos a docentes por sección</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de creación */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Asignación
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <Select
              label="Docente"
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value);
                setError(null);
              }}
              options={[
                { value: '', label: 'Selecciona un docente' },
                ...teachers.map(t => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name} (${t.current_assignments}/6 cursos)`,
                })),
              ]}
              required
            />
          </div>

          <div>
            <Select
              label="Sección"
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setError(null);
              }}
              options={[
                { value: '', label: 'Selecciona una sección' },
                ...sections.map(s => ({
                  value: s.id,
                  label: `${s.grade_levels.name} - Sección ${s.section_letter}`,
                })),
              ]}
              required
            />
          </div>

          <div>
            <Select
              label="Curso"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setError(null);
              }}
              options={[
                { value: '', label: 'Selecciona un curso' },
                ...courses.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.code})`,
                })),
              ]}
              required
            />
          </div>
        </div>

        {selectedTeacherData && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{selectedTeacherData.first_name} {selectedTeacherData.last_name}</strong> tiene{' '}
              <strong>{selectedTeacherData.current_assignments} curso(s)</strong> asignado(s).{' '}
              {canAddMore ? (
                <span className="text-green-700 font-semibold">
                  Puede agregar {6 - selectedTeacherData.current_assignments} más.
                </span>
              ) : (
                <span className="text-red-700 font-semibold">
                  Ha alcanzado el límite máximo de 6 cursos.
                </span>
              )}
            </p>
          </div>
        )}

        <Button
          onClick={handleCreateAssignment}
          disabled={!selectedTeacher || !selectedSection || !selectedCourse || !canAddMore || submitting}
        >
          <Plus className="w-5 h-5 mr-2" />
          {submitting ? 'Creando...' : 'Crear Asignación'}
        </Button>
      </Card>

      {/* Lista de asignaciones por docente */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Asignaciones Actuales ({Object.keys(assignmentsByTeacher).length} docentes)
        </h2>

        {Object.entries(assignmentsByTeacher).length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay asignaciones creadas aún</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Object.entries(assignmentsByTeacher).map(([teacherId, data]) => {
              const teacher = teachers.find(t => t.id === teacherId);
              const assignmentCount = data.assignments.length;
              const isAtLimit = assignmentCount >= 6;

              return (
                <Card key={teacherId} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{data.teacher_name}</h3>
                      <p className="text-sm text-gray-600">{teacher?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isAtLimit ? 'error' : assignmentCount >= 4 ? 'warning' : 'success'}>
                        {assignmentCount}/6 cursos
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{assignment.course_name}</p>
                            <p className="text-sm text-gray-600">
                              {assignment.grade_level_name} - {assignment.section_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {assignment.student_count} estudiantes
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id, teacherId)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors flex-shrink-0"
                            title="Eliminar asignación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen */}
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Resumen del Sistema</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-700">Total docentes</p>
            <p className="text-2xl font-bold text-blue-900">{teachers.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Total asignaciones</p>
            <p className="text-2xl font-bold text-blue-900">{assignments.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Docentes con asignaciones</p>
            <p className="text-2xl font-bold text-blue-900">
              {Object.keys(assignmentsByTeacher).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Promedio cursos/docente</p>
            <p className="text-2xl font-bold text-blue-900">
              {Object.keys(assignmentsByTeacher).length > 0
                ? (assignments.length / Object.keys(assignmentsByTeacher).length).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
