import { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, CheckCircle2, AlertCircle, Edit2, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { SubmissionStatus } from '../../lib/database.types';

interface Course {
  id: string;
  code: string;
  name: string;
  section: {
    id: string;
    name: string;
    grade_level: {
      name: string;
    };
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_score: number;
  attachment_url: string | null;
  created_at: string;
  total_students: number;
  submitted_count: number;
  reviewed_count: number;
}

interface StudentSubmission {
  student_id: string;
  student_name: string;
  student_code: string;
  submission_id: string | null;
  submission_text: string | null;
  attachment_url: string | null;
  score: number | null;
  feedback: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
}

interface AssignmentForm {
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  attachment_url: string;
}

export function TeacherTasksPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<StudentSubmission[]>([]);
  const [formData, setFormData] = useState<AssignmentForm>({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_score: 20,
    attachment_url: '',
  });
  const [savingForm, setSavingForm] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<StudentSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  useEffect(() => {
    loadTeacherCourses();
  }, [profile]);

  useEffect(() => {
    if (selectedCourse) {
      loadAssignments();
    }
  }, [selectedCourse]);

  async function loadTeacherCourses() {
    try {
      setLoading(true);

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (yearError) throw yearError;

      if (!activeYear) {
        console.warn('No active academic year found');
        setCourses([]);
        setLoading(false);
        return;
      }

      // Verificar si el usuario es admin/director/coordinator
      const isAdminRole = ['admin', 'director', 'coordinator'].includes(profile?.role || '');

      if (isAdminRole) {
        // Admin ve todos los cursos/secciones
        const { data, error } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            course:courses(
              id,
              code,
              name
            ),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name)
            )
          `)
          .eq('academic_year_id', activeYear.id)
          .order('course_id');

        if (error) throw error;

        const coursesData = data?.map((item: any) => ({
          id: item.course.id,
          code: item.course.code,
          name: item.course.name,
          section: item.section
        })).filter(Boolean) || [];

        setCourses(coursesData);

        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      } else {
        // Docente: solo ve sus cursos asignados
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', profile?.id)
          .maybeSingle();

        if (teacherError) throw teacherError;

        if (!teacherData) {
          console.warn('No teacher record found for this user');
          setCourses([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            course:courses(
              id,
              code,
              name
            ),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name)
            )
          `)
          .eq('teacher_id', teacherData.id)
          .eq('academic_year_id', activeYear.id);

        if (error) throw error;

        const coursesData = data?.map((item: any) => ({
          id: item.course.id,
          code: item.course.code,
          name: item.course.name,
          section: item.section
        })).filter(Boolean) || [];

        setCourses(coursesData);

        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignments() {
    try {
      setLoading(true);

      const course = courses.find((c) => c.id === selectedCourse);
      if (!course) return;

      // Cargar tareas del curso
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', selectedCourse)
        .eq('section_id', course.section.id)
        .order('due_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Para cada tarea, contar estudiantes inscritos en el curso
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      const { count: totalStudents } = await supabase
        .from('student_course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', selectedCourse)
        .eq('section_id', course.section.id)
        .eq('academic_year_id', activeYear?.id)
        .eq('status', 'active');

      const enrichedAssignments = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('status')
            .eq('assignment_id', assignment.id);

          const submitted = submissions?.filter(
            (s) => s.status === 'entregada' || s.status === 'revisada' || s.status === 'atrasada'
          ).length || 0;

          const reviewed = submissions?.filter((s) => s.status === 'revisada').length || 0;

          return {
            ...assignment,
            total_students: totalStudents || 0,
            submitted_count: submitted,
            reviewed_count: reviewed,
          };
        })
      );

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignmentDetail(assignment: Assignment) {
    try {
      const course = courses.find((c) => c.id === selectedCourse);
      if (!course) return;

      // Cargar todos los estudiantes de la sección
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, student_code, first_name, last_name')
        .eq('section_id', course.section.id)
        .order('last_name, first_name');

      if (studentsError) throw studentsError;

      // Cargar todas las entregas
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignment.id);

      if (submissionsError) throw submissionsError;

      // Combinar datos
      const studentsWithSubmissions: StudentSubmission[] = (studentsData || []).map((student) => {
        const submission = submissions?.find((s) => s.student_id === student.id);
        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          student_code: student.student_code,
          submission_id: submission?.id || null,
          submission_text: submission?.submission_text || null,
          attachment_url: submission?.attachment_url || null,
          score: submission?.score || null,
          feedback: submission?.feedback || null,
          status: submission?.status || 'pendiente',
          submitted_at: submission?.submitted_at || null,
        };
      });

      setStudents(studentsWithSubmissions);
      setSelectedAssignment(assignment);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading assignment detail:', error);
    }
  }

  function handleCreateClick() {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      due_date: '',
      max_score: 20,
      attachment_url: '',
    });
    setShowCreateModal(true);
  }

  function handleEditClick(assignment: Assignment) {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      due_date: assignment.due_date.split('T')[0],
      max_score: assignment.max_score,
      attachment_url: assignment.attachment_url || '',
    });
    setShowEditModal(true);
  }

  async function handleSaveAssignment() {
    if (!formData.title.trim() || !formData.due_date) {
      alert('El título y la fecha límite son obligatorios');
      return;
    }

    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    try {
      setSavingForm(true);

      if (editingAssignment) {
        // Editar
        const { error } = await supabase
          .from('assignments')
          .update({
            title: formData.title,
            description: formData.description || null,
            instructions: formData.instructions || null,
            due_date: formData.due_date,
            max_score: formData.max_score,
            attachment_url: formData.attachment_url || null,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', editingAssignment.id);

        if (error) throw error;

        alert('Tarea actualizada exitosamente');
        setShowEditModal(false);
      } else {
        // Crear
        const { error } = await supabase.from('assignments').insert({
          course_id: selectedCourse,
          section_id: course.section.id,
          title: formData.title,
          description: formData.description || null,
          instructions: formData.instructions || null,
          due_date: formData.due_date,
          max_score: formData.max_score,
          attachment_url: formData.attachment_url || null,
          created_by: profile?.id,
        } as never);

        if (error) throw error;

        alert('Tarea creada exitosamente');
        setShowCreateModal(false);
      }

      loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error al guardar la tarea');
    } finally {
      setSavingForm(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!confirm('¿Está seguro de eliminar esta tarea? Se eliminarán todas las entregas.')) {
      return;
    }

    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);

      if (error) throw error;

      alert('Tarea eliminada exitosamente');
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error al eliminar la tarea');
    }
  }

  async function handleGradeSubmission() {
    if (!gradingStudent || !gradingStudent.submission_id) return;

    const score = parseInt(gradeForm.score);
    if (isNaN(score) || score < 0 || score > (selectedAssignment?.max_score || 20)) {
      alert(`La calificación debe estar entre 0 y ${selectedAssignment?.max_score || 20}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score,
          feedback: gradeForm.feedback || null,
          status: 'revisada',
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
        } as never)
        .eq('id', gradingStudent.submission_id);

      if (error) throw error;

      alert('Calificación guardada exitosamente');
      setGradingStudent(null);
      setGradeForm({ score: '', feedback: '' });

      // Recargar detalle
      if (selectedAssignment) {
        await loadAssignmentDetail(selectedAssignment);
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Error al calificar');
    }
  }

  function getStatusBadge(status: SubmissionStatus) {
    switch (status) {
      case 'pendiente':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'entregada':
        return <Badge variant="primary">Entregada</Badge>;
      case 'revisada':
        return <Badge variant="success">Calificada</Badge>;
      case 'atrasada':
        return <Badge variant="error">Atrasada</Badge>;
    }
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date();
  }

  if (loading && courses.length === 0) {
    return <Loading fullScreen text="Cargando cursos..." />;
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-[#334155]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">No hay cursos asignados</h3>
            <p className="text-[#334155]">No tienes cursos asignados para gestionar tareas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCourse = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Gestión de Tareas</h1>
          <p className="text-[#334155]">Crea y gestiona tareas para tus cursos</p>
        </div>
        <Button icon={<Plus />} onClick={handleCreateClick}>
          Nueva Tarea
        </Button>
      </div>

      {/* Selector de curso */}
      <Card>
        <CardContent className="pt-6">
          <Select
            label="Curso"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name} ({course.section.grade_level.name}{' '}
                {course.section.name})
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      {loading ? (
        <Loading text="Cargando tareas..." />
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">No hay tareas creadas</h3>
              <p className="text-[#334155] mb-4">
                Crea tu primera tarea para este curso haciendo clic en "Nueva Tarea"
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#0F172A]">{assignment.title}</h3>
                      {isOverdue(assignment.due_date) && (
                        <Badge variant="error">
                          <Clock className="w-3 h-3 mr-1" />
                          Vencida
                        </Badge>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-[#334155] mb-3 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-[#334155]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Límite: {new Date(assignment.due_date).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {assignment.submitted_count}/{assignment.total_students} entregas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {assignment.reviewed_count}/{assignment.submitted_count} calificadas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      icon={<Eye />}
                      variant="outline"
                      size="sm"
                      onClick={() => loadAssignmentDetail(assignment)}
                    >
                      Ver entregas
                    </Button>
                    <Button
                      icon={<Edit2 />}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(assignment)}
                    >
                      Editar
                    </Button>
                    <Button
                      icon={<Trash2 />}
                      variant="error"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Crear tarea */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Tarea"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Ensayo sobre la independencia del Perú"
          />
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descripción de la tarea..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E3A8A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">
              Instrucciones detalladas
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Describe paso a paso lo que deben hacer los estudiantes..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E3A8A] transition-colors"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Fecha límite *"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <Input
              label="Puntaje máximo"
              type="number"
              value={formData.max_score.toString()}
              onChange={(e) =>
                setFormData({ ...formData, max_score: parseInt(e.target.value) || 20 })
              }
            />
          </div>
          <Input
            label="URL de archivo adjunto (opcional)"
            value={formData.attachment_url}
            onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
            placeholder="https://drive.google.com/..."
            helperText="Por ahora, pega el enlace público del archivo (Drive, etc.)"
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignment} loading={savingForm}>
              Crear Tarea
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Editar tarea */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Tarea"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E3A8A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Instrucciones</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E3A8A] transition-colors"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Fecha límite *"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <Input
              label="Puntaje máximo"
              type="number"
              value={formData.max_score.toString()}
              onChange={(e) =>
                setFormData({ ...formData, max_score: parseInt(e.target.value) || 20 })
              }
            />
          </div>
          <Input
            label="URL de archivo adjunto (opcional)"
            value={formData.attachment_url}
            onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignment} loading={savingForm}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle de entregas */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Entregas: ${selectedAssignment?.title}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#F8FAFC] rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{students.length}</p>
                <p className="text-sm text-[#334155]">Total estudiantes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {students.filter((s) => s.status !== 'pendiente').length}
                </p>
                <p className="text-sm text-[#334155]">Entregas recibidas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.status === 'revisada').length}
                </p>
                <p className="text-sm text-[#334155]">Calificadas</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Estudiante
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Estado
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Fecha entrega
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Nota
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-sm text-[#334155]">{student.student_code}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                      {student.student_name}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(student.status)}</td>
                    <td className="py-3 px-4 text-center text-sm text-[#334155]">
                      {student.submitted_at
                        ? new Date(student.submitted_at).toLocaleDateString('es-PE')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.score !== null ? (
                        <span className="font-bold text-[#0E3A8A]">{student.score}</span>
                      ) : (
                        <span className="text-[#334155]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.status !== 'pendiente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGradingStudent(student);
                            setGradeForm({
                              score: student.score?.toString() || '',
                              feedback: student.feedback || '',
                            });
                          }}
                        >
                          {student.status === 'revisada' ? 'Editar nota' : 'Calificar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal: Calificar entrega */}
      {gradingStudent && (
        <Modal
          isOpen={!!gradingStudent}
          onClose={() => setGradingStudent(null)}
          title={`Calificar: ${gradingStudent.student_name}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Mostrar entrega */}
            <div className="p-4 bg-[#F8FAFC] rounded-lg">
              <h4 className="font-semibold text-[#0F172A] mb-2">Entrega del estudiante:</h4>
              {gradingStudent.submission_text && (
                <p className="text-sm text-[#334155] mb-2">{gradingStudent.submission_text}</p>
              )}
              {gradingStudent.attachment_url && (
                <a
                  href={gradingStudent.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0E3A8A] hover:underline"
                >
                  Ver archivo adjunto →
                </a>
              )}
              {!gradingStudent.submission_text && !gradingStudent.attachment_url && (
                <p className="text-sm text-[#334155] italic">Sin contenido de entrega</p>
              )}
            </div>

            <Input
              label={`Calificación (0-${selectedAssignment?.max_score || 20}) *`}
              type="number"
              value={gradeForm.score}
              onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
              min={0}
              max={selectedAssignment?.max_score || 20}
            />

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Retroalimentación
              </label>
              <textarea
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                placeholder="Escribe tus comentarios para el estudiante..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E3A8A] transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setGradingStudent(null)}>
                Cancelar
              </Button>
              <Button onClick={handleGradeSubmission}>Guardar Calificación</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
