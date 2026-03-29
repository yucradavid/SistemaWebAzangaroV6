import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle2, AlertCircle, Users, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { SubmissionStatus } from '../../lib/database.types';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  section: {
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
  course: {
    code: string;
    name: string;
  };
  submission: {
    id: string | null;
    submission_text: string | null;
    attachment_url: string | null;
    score: number | null;
    feedback: string | null;
    status: SubmissionStatus;
    submitted_at: string | null;
  } | null;
}

export function GuardianTasksPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [profile]);

  useEffect(() => {
    if (selectedStudent) {
      loadAssignments();
    }
  }, [selectedStudent]);

  async function loadStudents() {
    try {
      setLoading(true);

      // Obtener guardian_id
      const { data: guardianList, error: guardianError } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', profile?.id);

      if (guardianError) throw guardianError;

      if (!guardianList || guardianList.length === 0) {
        console.warn('No guardian record found for this user');
        setLoading(false);
        return;
      }

      const guardianData = guardianList[0];

      // Cargar hijos del apoderado a través de student_guardians
      const { data: studentLinks, error: linksError } = await supabase
        .from('student_guardians')
        .select(`
          student:students(
            id,
            first_name,
            last_name,
            section:sections(
              section_letter,
              grade_level:grade_levels(name)
            )
          )
        `)
        .eq('guardian_id', guardianData.id);

      if (linksError) throw linksError;

      const studentsList = (studentLinks || [])
        .map((link: any) => link.student)
        .filter(Boolean)
        .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));

      setStudents(studentsList);
      if (studentsList && studentsList.length > 0) {
        setSelectedStudent(studentsList[0].id);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignments() {
    try {
      setLoading(true);

      const student = students.find((s) => s.id === selectedStudent);
      if (!student) return;

      // Obtener section_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('section_id')
        .eq('id', selectedStudent)
        .single();

      if (studentError) throw studentError;

      // Cargar tareas de la sección
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
        .eq('section_id', studentData.section_id)
        .order('due_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Cargar entregas del estudiante
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', selectedStudent);

      if (submissionsError) throw submissionsError;

      // Combinar datos
      const enrichedAssignments = (assignmentsData || []).map((assignment) => {
        const submission = submissions?.find((s) => s.assignment_id === assignment.id);

        return {
          ...assignment,
          submission: submission
            ? {
              id: submission.id,
              submission_text: submission.submission_text,
              attachment_url: submission.attachment_url,
              score: submission.score,
              feedback: submission.feedback,
              status: submission.status,
              submitted_at: submission.submitted_at,
            }
            : null,
        };
      });

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleViewDetail(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  }

  function getStatusBadge(assignment: Assignment) {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'revisada':
          return <Badge variant="success">Calificada</Badge>;
        case 'entregada':
          return <Badge variant="primary">Entregada</Badge>;
        case 'atrasada':
          return <Badge variant="error">Entregada tarde</Badge>;
      }
    }

    if (dueDate < now) {
      return <Badge variant="error">No entregada (Atrasada)</Badge>;
    }

    return <Badge variant="warning">Pendiente</Badge>;
  }

  if (loading && students.length === 0) {
    return <Loading fullScreen text="Cargando información..." />;
  }

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-12 h-12 text-[#334155]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">No hay estudiantes asignados</h3>
            <p className="text-[#334155]">
              No tienes estudiantes asociados a tu cuenta de apoderado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStudent = students.find((s) => s.id === selectedStudent);
  const pendingCount = assignments.filter(
    (a) => !a.submission || a.submission.status === 'pendiente'
  ).length;
  const submittedCount = assignments.filter(
    (a) => a.submission && (a.submission.status === 'entregada' || a.submission.status === 'atrasada')
  ).length;
  const gradedCount = assignments.filter(
    (a) => a.submission && a.submission.status === 'revisada'
  ).length;
  const overdueCount = assignments.filter((a) => {
    const dueDate = new Date(a.due_date);
    return dueDate < new Date() && (!a.submission || a.submission.status === 'pendiente');
  }).length;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Tareas de mis Hijos</h1>
        <p className="text-[#334155]">Monitorea el progreso académico de tus hijos</p>
      </div>

      {/* Selector de hijo */}
      <Card>
        <CardContent className="pt-6">
          <Select
            label="Seleccionar estudiante"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} - {student.section.grade_level.name}{' '}
                {student.section.section_letter}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Información del estudiante */}
      {currentStudent && (
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  {currentStudent.first_name} {currentStudent.last_name}
                </h2>
                <p className="text-[#334155]">
                  {currentStudent.section.grade_level.name} - {currentStudent.section.section_letter}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-[#0E3A8A]" />
              <span className="text-3xl font-bold text-[#0F172A]">{assignments.length}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Total tareas</p>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-yellow-600">{pendingCount}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Pendientes</p>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{submittedCount}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Entregadas</p>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{overdueCount}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Atrasadas</p>
          </CardContent>
        </Card>
      </div>

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
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">No hay tareas asignadas</h3>
              <p className="text-[#334155]">Aún no hay tareas para este estudiante</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const isOverdue = new Date(assignment.due_date) < new Date();
            const isGraded = assignment.submission?.status === 'revisada';

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
                        <Badge variant="outline">{assignment.course.code}</Badge>
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
                          <span
                            className={
                              isOverdue && !assignment.submission
                                ? 'text-red-600 font-semibold'
                                : ''
                            }
                          >
                            Límite:{' '}
                            {new Date(assignment.due_date).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {isGraded && assignment.submission?.score !== null && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-green-600">
                              Nota: {assignment.submission.score}/{assignment.max_score}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Button
                        icon={<FileText />}
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(assignment)}
                      >
                        Ver detalle
                      </Button>
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
              <Badge variant="outline">{selectedAssignment.course.code}</Badge>
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
                <h4 className="font-semibold text-[#0F172A] mb-2">Archivo adjunto del docente:</h4>
                <a
                  href={selectedAssignment.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0E3A8A] hover:underline"
                >
                  Ver archivo →
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
                  <p className="font-semibold text-[#0F172A]">
                    {selectedAssignment.max_score} puntos
                  </p>
                </div>
              </div>
            </div>

            {/* Mostrar entrega si existe */}
            {selectedAssignment.submission ? (
              <div className="border-t-2 border-[#E2E8F0] pt-4">
                <h4 className="font-semibold text-[#0F172A] mb-3">Entrega del estudiante:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#334155]">Estado:</span>
                    {getStatusBadge(selectedAssignment)}
                  </div>
                  {selectedAssignment.submission.submitted_at && (
                    <p className="text-sm text-[#334155]">
                      Entregado el:{' '}
                      {new Date(selectedAssignment.submission.submitted_at).toLocaleDateString(
                        'es-PE',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  )}
                  {selectedAssignment.submission.submission_text && (
                    <div>
                      <p className="text-xs text-[#334155] mb-1">Texto:</p>
                      <p className="text-sm text-[#0F172A] p-3 bg-[#F8FAFC] rounded-lg">
                        {selectedAssignment.submission.submission_text}
                      </p>
                    </div>
                  )}
                  {selectedAssignment.submission.attachment_url && (
                    <div>
                      <p className="text-xs text-[#334155] mb-1">Archivo:</p>
                      <a
                        href={selectedAssignment.submission.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0E3A8A] hover:underline"
                      >
                        Ver archivo del estudiante →
                      </a>
                    </div>
                  )}
                  {selectedAssignment.submission.status === 'revisada' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">
                        Retroalimentación del docente:
                      </h5>
                      {selectedAssignment.submission.score !== null && (
                        <p className="text-lg font-bold text-green-600 mb-2">
                          Nota: {selectedAssignment.submission.score}/
                          {selectedAssignment.max_score}
                        </p>
                      )}
                      {selectedAssignment.submission.feedback && (
                        <p className="text-sm text-green-900">
                          {selectedAssignment.submission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t-2 border-[#E2E8F0] pt-4">
                <div className="p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">Aún no hay entrega</p>
                    <p className="text-sm text-yellow-800">
                      El estudiante todavía no ha entregado esta tarea.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
