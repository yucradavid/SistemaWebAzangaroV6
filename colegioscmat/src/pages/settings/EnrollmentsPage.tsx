import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// import { AppLayout } from '../../components/layout/AppLayout';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  GraduationCap
} from 'lucide-react';

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  status: string;
  section_id: string | null;
  enrollment_date: string;
  sections: {
    id: string;
    section_letter: string;
    grade_level_id: string;
    grade_levels: {
      name: string;
      grade: number;
    };
  } | null;
  course_count?: number;
}

interface Section {
  id: string;
  section_letter: string;
  grade_level_id: string;
  academic_year_id: string;
  grade_levels: {
    name: string;
    level: string;
    grade: number;
  };
  academic_years: {
    name: string;
    is_active: boolean;
  };
}

interface GradeLevel {
  id: string;
  name: string;
  level: string;
  grade: number;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface EnrollmentCourse {
  id: string;
  course_id: string;
  status: string;
  enrollment_date: string;
  courses: {
    name: string;
    code: string;
  };
}

export function EnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Modal para matrícula nueva
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    section_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
  });

  // Modal para cambiar sección
  const [showChangeSectionModal, setShowChangeSectionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newSectionId, setNewSectionId] = useState('');

  // Modal para ver cursos
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [studentCourses, setStudentCourses] = useState<EnrollmentCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withdrawn: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [students]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      // Cargar años académicos
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('*')
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);

      // Cargar niveles de grado
      const { data: gradesData, error: gradesError } = await supabase
        .from('grade_levels')
        .select('*')
        .order('grade', { ascending: true });

      if (gradesError) throw gradesError;
      setGradeLevels(gradesData || []);

      // Cargar secciones con información completa
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          id,
          section_letter,
          grade_level_id,
          academic_year_id,
          grade_levels (
            name,
            level,
            grade
          ),
          academic_years (
            year,
            is_active
          )
        `)
        .order('section_letter', { ascending: true });

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      await loadStudents();
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          first_name,
          last_name,
          dni,
          status,
          section_id,
          enrollment_date,
          sections (
            id,
            section_letter,
            grade_level_id,
            grade_levels (
              name,
              grade
            )
          )
        `)
        .order('last_name', { ascending: true });

      if (error) throw error;

      // Contar cursos inscritos por estudiante
      const studentsWithCourses = await Promise.all(
        (data || []).map(async (student) => {
          const { count } = await supabase
            .from('student_course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('status', 'active');

          return {
            ...student,
            course_count: count || 0,
          };
        })
      );

      setStudents(studentsWithCourses);
    } catch (error) {
      console.error('Error loading students:', error);
      throw error;
    }
  }

  function calculateStats() {
    setStats({
      total: students.length,
      active: students.filter((s) => s.status === 'active').length,
      inactive: students.filter((s) => s.status === 'inactive').length,
      withdrawn: students.filter((s) => s.status === 'withdrawn').length,
    });
  }

  function getFilteredStudents() {
    return students.filter((student) => {
      const matchesSearch =
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

      const matchesGrade =
        filterGrade === 'all' ||
        student.sections?.grade_levels?.grade === parseInt(filterGrade);

      const matchesSection = filterSection === 'all' || student.section_id === filterSection;

      return matchesSearch && matchesStatus && matchesGrade && matchesSection;
    });
  }

  async function handleEnrollStudent() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!newEnrollment.student_id || !newEnrollment.section_id) {
        setError('Selecciona un estudiante y una sección');
        return;
      }

      // Actualizar estudiante con sección
      const { error: updateError } = await supabase
        .from('students')
        .update({
          section_id: newEnrollment.section_id,
          enrollment_date: newEnrollment.enrollment_date,
          status: 'active',
        })
        .eq('id', newEnrollment.student_id);

      if (updateError) throw updateError;

      // Registrar en audit_logs
      await supabase.from('audit_logs').insert({
        table_name: 'students',
        record_id: newEnrollment.student_id,
        action: 'update',
        changes: {
          section_id: newEnrollment.section_id,
          enrollment_date: newEnrollment.enrollment_date,
          status: 'active',
        },
      });

      setSuccess('Estudiante matriculado exitosamente. Los cursos se asignaron automáticamente.');
      setShowEnrollModal(false);
      setNewEnrollment({
        student_id: '',
        section_id: '',
        enrollment_date: new Date().toISOString().split('T')[0],
      });

      await loadStudents();
    } catch (error) {
      console.error('Error enrolling student:', error);
      setError('Error al matricular estudiante');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeSection() {
    if (!selectedStudent || !newSectionId) {
      setError('Selecciona una nueva sección');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const oldSectionId = selectedStudent.section_id;

      // Actualizar sección del estudiante (el trigger actualizará los cursos)
      const { error: updateError } = await supabase
        .from('students')
        .update({ section_id: newSectionId })
        .eq('id', selectedStudent.id);

      if (updateError) throw updateError;

      // Registrar en audit_logs
      await supabase.from('audit_logs').insert({
        table_name: 'students',
        record_id: selectedStudent.id,
        action: 'update',
        changes: {
          section_id: { from: oldSectionId, to: newSectionId },
        },
      });

      setSuccess(
        'Sección actualizada. Los cursos antiguos fueron marcados como "dropped" y se asignaron los cursos de la nueva sección.'
      );
      setShowChangeSectionModal(false);
      setSelectedStudent(null);
      setNewSectionId('');

      await loadStudents();
    } catch (error) {
      console.error('Error changing section:', error);
      setError('Error al cambiar de sección');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStatus(studentId: string, newStatus: string) {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', studentId);

      if (updateError) throw updateError;

      // Registrar en audit_logs
      await supabase.from('audit_logs').insert({
        table_name: 'students',
        record_id: studentId,
        action: 'update',
        changes: { status: newStatus },
      });

      setSuccess(
        `Estado actualizado. ${newStatus !== 'active'
          ? 'Los cursos activos fueron marcados como "dropped".'
          : 'Estudiante reactivado.'
        }`
      );

      await loadStudents();
    } catch (error) {
      console.error('Error changing status:', error);
      setError('Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentCourses(studentId: string) {
    try {
      setLoadingCourses(true);

      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select(`
          id,
          course_id,
          status,
          enrollment_date,
          courses (
            name,
            code
          )
        `)
        .eq('student_id', studentId)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setStudentCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Error al cargar cursos del estudiante');
    } finally {
      setLoadingCourses(false);
    }
  }

  function openCoursesModal(student: Student) {
    setSelectedStudent(student);
    setShowCoursesModal(true);
    loadStudentCourses(student.id);
  }

  function openChangeSectionModal(student: Student) {
    setSelectedStudent(student);
    setNewSectionId(student.section_id || '');
    setShowChangeSectionModal(true);
  }

  const filteredStudents = getFilteredStudents();

  // Obtener estudiantes sin sección para el modal de matrícula
  const unassignedStudents = students.filter((s) => !s.section_id && s.status !== 'withdrawn');

  // Filtrar secciones por año académico activo para el modal
  const activeSections = sections.filter((s) => s.academic_years?.is_active);

  if (loading && students.length === 0) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }

  return (
    // <AppLayout>
    <div className="space-y-6">
      <GoBackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Matrículas</h1>
              <p className="text-gray-600">Administra las matrículas de estudiantes a secciones</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowEnrollModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Matricular Estudiante
        </Button>
      </div>

      {/* Mensajes */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <p>{success}</p>
          </div>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retirados</p>
              <p className="text-2xl font-bold text-red-600">{stats.withdrawn}</p>
            </div>
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="withdrawn">Retirado</option>
          </Select>
          <Select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
            <option value="all">Todos los grados</option>
            {gradeLevels.map((grade) => (
              <option key={grade.id} value={grade.grade.toString()}>
                {grade.name}
              </option>
            ))}
          </Select>
          <Select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="all">Todas las secciones</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.grade_levels?.grade}° {section.section_letter} - {section.academic_years?.year}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setFilterGrade('all');
              setFilterSection('all');
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Tabla de estudiantes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{student.student_code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      {student.dni && (
                        <div className="text-sm text-gray-500">DNI: {student.dni}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.sections ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {student.sections.grade_levels.grade}° {student.sections.section_letter}
                        </div>
                        <div className="text-gray-500">{student.sections.grade_levels.name}</div>
                      </div>
                    ) : (
                      <Badge variant="warning">Sin asignar</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openCoursesModal(student)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <BookOpen className="w-4 h-4" />
                      {student.course_count || 0} cursos
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        student.status === 'active'
                          ? 'success'
                          : student.status === 'inactive'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {student.status === 'active'
                        ? 'Activo'
                        : student.status === 'inactive'
                          ? 'Inactivo'
                          : 'Retirado'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.enrollment_date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openChangeSectionModal(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Cambiar sección"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {student.status === 'active' && (
                        <button
                          onClick={() => handleChangeStatus(student.id, 'withdrawn')}
                          className="text-red-600 hover:text-red-800"
                          title="Retirar estudiante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {student.status === 'withdrawn' && (
                        <button
                          onClick={() => handleChangeStatus(student.id, 'active')}
                          className="text-green-600 hover:text-green-800"
                          title="Reactivar estudiante"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron estudiantes</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Matricular estudiante */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Matricular Estudiante"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estudiante sin sección
            </label>
            <Select
              value={newEnrollment.student_id}
              onChange={(e) =>
                setNewEnrollment({ ...newEnrollment, student_id: e.target.value })
              }
            >
              <option value="">Selecciona un estudiante</option>
              {unassignedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_code} - {student.first_name} {student.last_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sección (Año activo)
            </label>
            <Select
              value={newEnrollment.section_id}
              onChange={(e) =>
                setNewEnrollment({ ...newEnrollment, section_id: e.target.value })
              }
            >
              <option value="">Selecciona una sección</option>
              {activeSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.grade_levels?.grade}° {section.section_letter} -{' '}
                  {section.grade_levels?.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Matrícula
            </label>
            <Input
              type="date"
              value={newEnrollment.enrollment_date}
              onChange={(e) =>
                setNewEnrollment({ ...newEnrollment, enrollment_date: e.target.value })
              }
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                Al matricular al estudiante en una sección, se le asignarán automáticamente todos
                los cursos configurados para esa sección en el año académico activo.
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnrollStudent} disabled={loading}>
              {loading ? 'Matriculando...' : 'Matricular'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Cambiar sección */}
      <Modal
        isOpen={showChangeSectionModal}
        onClose={() => setShowChangeSectionModal(false)}
        title="Cambiar Sección"
      >
        <div className="space-y-4">
          {selectedStudent && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estudiante</p>
                <p className="font-medium text-gray-900">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-sm text-gray-600 mt-2">Código: {selectedStudent.student_code}</p>
                {selectedStudent.sections && (
                  <p className="text-sm text-gray-600">
                    Sección actual: {selectedStudent.sections.grade_levels.grade}°{' '}
                    {selectedStudent.sections.section_letter}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Sección
                </label>
                <Select value={newSectionId} onChange={(e) => setNewSectionId(e.target.value)}>
                  <option value="">Selecciona una sección</option>
                  {activeSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.grade_levels?.grade}° {section.section_letter} -{' '}
                      {section.grade_levels?.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    Los cursos de la sección anterior serán marcados como "dropped" y se asignarán
                    automáticamente los cursos de la nueva sección.
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setShowChangeSectionModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleChangeSection} disabled={loading}>
                  {loading ? 'Cambiando...' : 'Cambiar Sección'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal: Ver cursos del estudiante */}
      <Modal
        isOpen={showCoursesModal}
        onClose={() => setShowCoursesModal(false)}
        title="Cursos del Estudiante"
      >
        <div className="space-y-4">
          {selectedStudent && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estudiante</p>
                <p className="font-medium text-gray-900">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                {selectedStudent.sections && (
                  <p className="text-sm text-gray-600 mt-1">
                    Sección: {selectedStudent.sections.grade_levels.grade}°{' '}
                    {selectedStudent.sections.section_letter}
                  </p>
                )}
              </div>

              {loadingCourses ? (
                <Loading />
              ) : studentCourses.length > 0 ? (
                <div className="space-y-2">
                  {studentCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{enrollment.courses.name}</p>
                        <p className="text-sm text-gray-600">Código: {enrollment.courses.code}</p>
                        <p className="text-xs text-gray-500">
                          Inscrito:{' '}
                          {new Date(enrollment.enrollment_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === 'active'
                            ? 'success'
                            : enrollment.status === 'completed'
                              ? 'info'
                              : 'error'
                        }
                      >
                        {enrollment.status === 'active'
                          ? 'Activo'
                          : enrollment.status === 'completed'
                            ? 'Completado'
                            : 'Retirado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cursos asignados</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="secondary" onClick={() => setShowCoursesModal(false)}>
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
    // </AppLayout>
  );
}
