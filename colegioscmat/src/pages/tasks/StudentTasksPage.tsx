import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle2, AlertCircle, Upload, FileText, Calendar, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SubmitTaskModal } from '../../components/tasks/SubmitTaskModal';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_score: number;
  attachment_url: string | null;
  course: {
    code: string;
    name: string;
  };
  submission: {
    id: string;
    content: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_size: number | null;
    grade: number | null;
    grade_letter: string | null;
    feedback: string | null;
    status: 'draft' | 'submitted' | 'graded' | 'returned';
    submission_date: string;
  } | null;
}

type FilterType = 'today' | 'week' | 'overdue' | 'all';

export function StudentTasksPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    loadAssignments();
  }, [profile]);

  async function loadAssignments() {
    try {
      setLoading(true);

      // Obtener student_id y el año académico activo
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, section_id')
        .eq('user_id', profile?.id || '')
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        console.log('No student record found for this user');
        setLoading(false);
        return;
      }

      setStudentId(studentData.id);

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;

      // Obtener cursos en los que está matriculado el estudiante
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_course_enrollments')
        .select('course_id, section_id')
        .eq('student_id', studentData.id)
        .eq('academic_year_id', activeYear.id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        console.log('Student not enrolled in any courses');
        setAssignments([]);
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);
      const sectionIds = enrollments.map(e => e.section_id);

      // Cargar tareas de los cursos matriculados
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          instructions,
          due_date,
          max_score,
          attachment_url,
          course:courses(code, name)
        `)
        .in('course_id', courseIds)
        .in('section_id', sectionIds)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Cargar entregas del estudiante desde la nueva tabla
      const { data: submissions, error: submissionsError } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('student_id', studentData?.id || '');

      if (submissionsError) throw submissionsError;

      // Combinar datos
      const enrichedAssignments = (assignmentsData || []).map((assignment: any) => {
        const submission = submissions?.find((s: any) => s.assignment_id === assignment.id);

        return {
          ...assignment,
          submission: submission || null,
        };
      });

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterAssignments(assignments: Assignment[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (filter) {
      case 'today':
        return assignments.filter((a) => {
          const dueDate = new Date(a.due_date);
          return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
      case 'week':
        return assignments.filter((a) => {
          const dueDate = new Date(a.due_date);
          return dueDate >= today && dueDate <= weekFromNow;
        });
      case 'overdue':
        return assignments.filter((a) => {
          const dueDate = new Date(a.due_date);
          return dueDate < now && (!a.submission || a.submission.status === 'draft');
        });
      case 'all':
      default:
        return assignments;
    }
  }

  function handleViewDetail(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  }

  function handleSubmitClick(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  }

  function handleSubmitSuccess() {
    loadAssignments();
  }

  function getStatusBadge(assignment: Assignment) {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'graded':
          return <Badge variant="success">Calificada</Badge>;
        case 'submitted':
          return <Badge variant="info">Entregada</Badge>;
        case 'returned':
          return <Badge variant="warning">Devuelta</Badge>;
        case 'draft':
          return <Badge variant="default">Borrador</Badge>;
      }
    }

    if (dueDate < now) {
      return <Badge variant="error">Atrasada</Badge>;
    }

    return <Badge variant="warning">Pendiente</Badge>;
  }

  function canSubmit(assignment: Assignment) {
    // Puede entregar si:
    // 1. No hay entrega aún
    // 2. Ya entregó pero aún no fue calificada
    if (!assignment.submission) {
      return true;
    }

    // Si ya fue calificada, no puede reenviar
    if (assignment.submission.status === 'graded') {
      return false;
    }

    return true;
  }

  if (loading) {
    return <Loading fullScreen text="Cargando tareas..." />;
  }

  const filteredAssignments = filterAssignments(assignments);
  const weekCount = assignments.filter((a) => {
    const now = new Date();
    const dueDate = new Date(a.due_date);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return dueDate >= now && dueDate <= weekFromNow;
  }).length;
  const overdueCount = assignments.filter((a) => {
    const dueDate = new Date(a.due_date);
    return dueDate < new Date() && (!a.submission || a.submission.status === 'draft');
  }).length;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-cermat-blue-dark mb-2">Mis Tareas</h1>
        <p className="text-slate-600">Organiza y entrega tus trabajos a tiempo</p>
      </div>

      {/* Filtros rápidos */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card
          variant={filter === 'today' ? 'elevated' : 'default'}
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={() => setFilter('today')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-[#0E3A8A]" />
              <span className="text-3xl font-bold text-[#0F172A]">
                {assignments.filter((a) => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const dueDate = new Date(a.due_date);
                  return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                }).length}
              </span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Para hoy</p>
          </CardContent>
        </Card>

        <Card
          variant={filter === 'week' ? 'elevated' : 'default'}
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={() => setFilter('week')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-[#0F172A]">{weekCount}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Esta semana</p>
          </CardContent>
        </Card>

        <Card
          variant={filter === 'overdue' ? 'elevated' : 'default'}
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={() => setFilter('overdue')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{overdueCount}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Atrasadas</p>
          </CardContent>
        </Card>

        <Card
          variant={filter === 'all' ? 'elevated' : 'default'}
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={() => setFilter('all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-[#0E3A8A]" />
              <span className="text-3xl font-bold text-[#0F172A]">{assignments.length}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Todas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tareas */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay tareas {filter === 'today' ? 'para hoy' : filter === 'week' ? 'esta semana' : filter === 'overdue' ? 'atrasadas' : ''}
              </h3>
              <p className="text-[#334155]">
                {filter === 'all'
                  ? 'Aún no tienes tareas asignadas'
                  : 'Cambia el filtro para ver otras tareas'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const isOverdue = new Date(assignment.due_date) < new Date();
            const isGraded = assignment.submission?.status === 'graded';

            return (
              <Card key={assignment.id} variant="elevated">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#0F172A]">{assignment.title}</h3>
                        {getStatusBadge(assignment)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{assignment.course.code}</Badge>
                        <span className="text-sm text-[#334155]">{assignment.course.name}</span>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-[#334155] mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-[#334155]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className={isOverdue && !assignment.submission ? 'text-red-600 font-semibold' : ''}>
                            Límite: {new Date(assignment.due_date).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {isGraded && assignment.submission && assignment.submission.grade !== null && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-600">
                              Nota: {assignment.submission.grade_letter} ({assignment.submission.grade}/20)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        icon={<FileText />}
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(assignment)}
                      >
                        Ver detalle
                      </Button>
                      {canSubmit(assignment) && (
                        <Button
                          icon={<Upload />}
                          size="sm"
                          onClick={() => handleSubmitClick(assignment)}
                        >
                          {assignment.submission ? 'Actualizar' : 'Entregar'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Ver detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedAssignment?.title || ''}
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="default">{selectedAssignment.course.code}</Badge>
              <span className="text-sm text-[#334155]">{selectedAssignment.course.name}</span>
            </div>

            {selectedAssignment.description && (
              <div>
                <h4 className="font-semibold text-[#0F172A] mb-2">Descripción:</h4>
                <p className="text-sm text-[#334155]">{selectedAssignment.description}</p>
              </div>
            )}

            {selectedAssignment.instructions && (
              <div>
                <h4 className="font-semibold text-[#0F172A] mb-2">Instrucciones:</h4>
                <p className="text-sm text-[#334155] whitespace-pre-wrap">
                  {selectedAssignment.instructions}
                </p>
              </div>
            )}

            {selectedAssignment.attachment_url && (
              <div>
                <h4 className="font-semibold text-[#0F172A] mb-2">Archivo adjunto:</h4>
                <a
                  href={selectedAssignment.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0E3A8A] hover:underline"
                >
                  Ver archivo del docente →
                </a>
              </div>
            )}

            <div className="p-4 bg-[#F8FAFC] rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#334155] mb-1">Fecha límite:</p>
                  <p className="font-semibold text-[#0F172A]">
                    {new Date(selectedAssignment.due_date).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#334155] mb-1">Puntaje máximo:</p>
                  <p className="font-semibold text-[#0F172A]">{selectedAssignment.max_score} puntos</p>
                </div>
              </div>
            </div>

            {/* Mostrar entrega si existe */}
            {selectedAssignment.submission && (
              <div className="border-t-2 border-[#E2E8F0] pt-4">
                <h4 className="font-semibold text-[#0F172A] mb-3">Tu entrega:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#334155]">Estado:</span>
                    {getStatusBadge(selectedAssignment)}
                  </div>
                  {selectedAssignment.submission.submission_date && (
                    <p className="text-sm text-[#334155]">
                      Entregado el:{' '}
                      {new Date(selectedAssignment.submission.submission_date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  {selectedAssignment.submission.content && (
                    <div>
                      <p className="text-xs text-[#334155] mb-1">Texto:</p>
                      <p className="text-sm text-[#0F172A] p-3 bg-[#F8FAFC] rounded-lg whitespace-pre-wrap">
                        {selectedAssignment.submission.content}
                      </p>
                    </div>
                  )}
                  {selectedAssignment.submission.attachment_url && (
                    <div>
                      <p className="text-xs text-[#334155] mb-1">Archivo adjunto:</p>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedAssignment.submission.attachment_name || 'Archivo adjunto'}
                          </p>
                          {selectedAssignment.submission.attachment_size && (
                            <p className="text-xs text-gray-500">
                              {(selectedAssignment.submission.attachment_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                        <a
                          href={selectedAssignment.submission.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Descargar</span>
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedAssignment.submission.status === 'graded' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">Retroalimentación del docente:</h5>
                      {selectedAssignment.submission.grade !== null && (
                        <p className="text-lg font-bold text-green-600 mb-2">
                          Nota: {selectedAssignment.submission.grade_letter} - {selectedAssignment.submission.grade}/20
                        </p>
                      )}
                      {selectedAssignment.submission.feedback && (
                        <p className="text-sm text-green-900 whitespace-pre-wrap">{selectedAssignment.submission.feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Entregar/Actualizar con upload */}
      {selectedAssignment && (
        <SubmitTaskModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          studentId={studentId}
          existingSubmission={selectedAssignment.submission}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
}
