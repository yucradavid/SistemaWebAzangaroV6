import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Users, Search, Edit2, UserX, UserCheck, BookOpen, AlertCircle, AlertTriangle } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';

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
  grade_levels: {
    name: string;
    level: string;
    grade: number;
  };
}

interface GradeLevel {
  id: string;
  name: string;
  level: string;
  grade: number;
}

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [newSectionId, setNewSectionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Cargar niveles de grado
      const { data: levelsData, error: levelsError } = await supabase
        .from('grade_levels')
        .select('*')
        .order('level', { ascending: true })
        .order('grade', { ascending: true });

      if (levelsError) throw levelsError;
      setGradeLevels(levelsData || []);

      // Cargar secciones
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          id,
          section_letter,
          grade_level_id,
          grade_levels (
            name,
            level,
            grade
          )
        `)
        .order('section_letter', { ascending: true });

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      await loadStudents();
    } catch (error) {
      console.error('Error loading data:', error);
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

      // Cargar conteo de cursos para cada estudiante
      const studentsWithCourses = await Promise.all(
        (data || []).map(async (student: any) => {
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
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.dni?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    const matchesGrade =
      gradeFilter === 'all' ? true :
      gradeFilter === 'no-section' ? !student.section_id :
      (student.sections?.grade_levels?.name === gradeFilter);

    const matchesSection =
      sectionFilter === 'all' ? true :
      sectionFilter === 'no-section' ? !student.section_id :
      (student.section_id === sectionFilter);

    return matchesSearch && matchesStatus && matchesGrade && matchesSection;
  });

  // Estudiantes sin sección asignada
  const studentsWithoutSection = students.filter(s => !s.section_id && s.status === 'active');

  async function handleChangeSection() {
    if (!selectedStudent || !newSectionId) {
      alert('Selecciona una sección');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('students')
        .update({ section_id: newSectionId })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      alert('Sección actualizada exitosamente. Los cursos se han sincronizado automáticamente.');
      setShowEditModal(false);
      setSelectedStudent(null);
      setNewSectionId('');
      loadStudents();
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Error al cambiar de sección');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangeStatus(student: Student, newStatus: string) {
    if (!confirm(`¿Estás seguro de cambiar el estado del estudiante a "${newStatus}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', student.id);

      if (error) throw error;

      alert(`Estado actualizado a "${newStatus}"`);
      loadStudents();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al cambiar el estado');
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactivo</Badge>;
      case 'withdrawn':
        return <Badge variant="error">Retirado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-cermat-blue-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-cermat-blue-dark">Gestión de Estudiantes</h1>
            <p className="text-slate-600">Administra matrículas y cambios de sección</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Buscar por código, nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="withdrawn">Retirados</option>
            </Select>

            <Select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setSectionFilter('all');
              }}
            >
              <option value="all">Todos los grados</option>
              <option value="no-section">⚠️ Sin sección asignada</option>
              {gradeLevels.map((level) => (
                <option key={level.id} value={level.name}>
                  {level.name}
                </option>
              ))}
            </Select>
          </div>

          {gradeFilter !== 'all' && (
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-start-4">
                <Select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                >
                  <option value="all">Todas las secciones</option>
                  {sections
                    .filter((s) => s.grade_levels.name === gradeFilter)
                    .map((section) => (
                      <option key={section.id} value={section.id}>
                        Sección {section.section_letter}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-900">{students.length}</div>
            <div className="text-sm text-gray-600">Total Estudiantes</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s) => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Activos</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter((s) => s.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s) => s.status === 'withdrawn').length}
            </div>
            <div className="text-sm text-gray-600">Retirados</div>
          </div>
        </Card>
      </div>

      {/* Alerta: Estudiantes sin sección */}
      {studentsWithoutSection.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  {studentsWithoutSection.length} estudiante(s) sin sección asignada
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Estos estudiantes no pueden ver su horario ni cursos hasta que se les asigne una sección.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {studentsWithoutSection.slice(0, 5).map((student) => (
                    <Button
                      key={student.id}
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-800 hover:bg-orange-100"
                      onClick={() => {
                        setSelectedStudent(student);
                        setNewSectionId('');
                        setShowEditModal(true);
                      }}
                    >
                      {student.first_name} {student.last_name}
                    </Button>
                  ))}
                  {studentsWithoutSection.length > 5 && (
                    <span className="text-sm text-orange-600 self-center">
                      y {studentsWithoutSection.length - 5} más...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla de estudiantes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron estudiantes</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-gray-50 ${!student.section_id && student.status === 'active' ? 'bg-orange-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!student.section_id && student.status === 'active' && (
                          <span title="Sin sección asignada">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{student.student_code}</div>
                          {student.dni && (
                            <div className="text-xs text-gray-400">DNI: {student.dni}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.sections ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.sections.grade_levels.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Sección {student.sections.section_letter}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="warning">Sin sección</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<BookOpen className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowCoursesModal(true);
                        }}
                      >
                        {student.course_count || 0} cursos
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.enrollment_date).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {student.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Edit2 className="w-4 h-4" />}
                              onClick={() => {
                                setSelectedStudent(student);
                                setNewSectionId(student.section_id || '');
                                setShowEditModal(true);
                              }}
                              title="Cambiar sección"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<UserX className="w-4 h-4" />}
                              onClick={() => handleChangeStatus(student, 'withdrawn')}
                              title="Retirar estudiante"
                            />
                          </>
                        )}
                        {student.status === 'withdrawn' && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<UserCheck className="w-4 h-4" />}
                            onClick={() => handleChangeStatus(student, 'active')}
                            title="Reactivar estudiante"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Cambiar sección */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
          setNewSectionId('');
        }}
        title="Cambiar Sección"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Estudiante:</strong> {selectedStudent?.first_name} {selectedStudent?.last_name}
            </p>
            <p className="text-sm text-blue-900">
              <strong>Sección actual:</strong>{' '}
              {selectedStudent?.sections
                ? `${selectedStudent.sections.grade_levels.name} - ${selectedStudent.sections.section_letter}`
                : 'Sin sección'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Sección *
            </label>
            <Select
              value={newSectionId}
              onChange={(e) => setNewSectionId(e.target.value)}
            >
              <option value="">Seleccionar sección</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.grade_levels.name} - Sección {section.section_letter}
                </option>
              ))}
            </Select>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-900">
              ⚠️ Al cambiar de sección, los cursos del estudiante se actualizarán automáticamente
              según los cursos asignados a la nueva sección.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
                setNewSectionId('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeSection}
              disabled={submitting || !newSectionId}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ver cursos del estudiante */}
      <StudentCoursesModal
        student={selectedStudent}
        isOpen={showCoursesModal}
        onClose={() => {
          setShowCoursesModal(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
}

// Componente auxiliar para mostrar cursos del estudiante
interface StudentCoursesModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

function StudentCoursesModal({ student, isOpen, onClose }: StudentCoursesModalProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      loadCourses();
    }
  }, [student, isOpen]);

  async function loadCourses() {
    if (!student) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select(`
          id,
          status,
          enrollment_date,
          courses (
            name,
            code
          )
        `)
        .eq('student_id', student.id)
        .order('status', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cursos del Estudiante">
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Estudiante:</strong> {student.first_name} {student.last_name}
          </p>
          <p className="text-sm text-blue-900">
            <strong>Código:</strong> {student.student_code}
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : courses.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No tiene cursos asignados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {enrollment.courses.name}
                  </div>
                  <div className="text-sm text-gray-500">{enrollment.courses.code}</div>
                </div>
                <div>
                  {enrollment.status === 'active' && (
                    <Badge variant="success">Activo</Badge>
                  )}
                  {enrollment.status === 'dropped' && (
                    <Badge variant="error">Retirado</Badge>
                  )}
                  {enrollment.status === 'completed' && (
                    <Badge variant="info">Completado</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
