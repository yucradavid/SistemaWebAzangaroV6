import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GradeSubmissionModal } from '../../components/tasks/GradeSubmissionModal';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_score: number;
  course: {
    code: string;
    name: string;
  };
  section: {
    name: string;
    grade_level: {
      name: string;
      level: string;
    };
  };
}

interface Submission {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  content: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  submission_date: string;
  grade: number | null;
  grade_letter: string | null;
  feedback: string | null;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
}

export function TeacherGradingPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [profile]);

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions();
    }
  }, [selectedAssignment]);

  async function loadAssignments() {
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
        setLoading(false);
        return;
      }

      // Verificar si el usuario es admin/director/coordinator
      const isAdminRole = ['admin', 'director', 'coordinator'].includes(profile?.role || '');

      let courseAssignments;

      if (isAdminRole) {
        // Admin ve todos los cursos
        const { data } = await supabase
          .from('teacher_course_assignments')
          .select('course_id, section_id')
          .eq('academic_year_id', activeYear.id);
        
        courseAssignments = data;
      } else {
        // Docente: solo ve sus cursos asignados
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', profile?.id || '')
          .maybeSingle();

        if (teacherError) {
          console.error('Error fetching teacher:', teacherError);
        }

        if (!teacherData) {
          console.log('No teacher record found for this user');
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('teacher_course_assignments')
          .select('course_id, section_id')
          .eq('teacher_id', teacherData.id)
          .eq('academic_year_id', activeYear.id);
        
        courseAssignments = data;
      }

      if (!courseAssignments || courseAssignments.length === 0) {
        setLoading(false);
        return;
      }

      // Cargar tareas
      const { data: assignmentsData, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_score,
          course:courses(code, name),
          section:sections(
            section_letter,
            grade_level:grade_levels(name, level)
          )
        `)
        .in('course_id', courseAssignments.map((ca: any) => ca.course_id))
        .order('due_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      setAssignments(assignmentsData as any || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions() {
    if (!selectedAssignment) return;

    try {
      setLoading(true);

      // Cargar todas las entregas de esta tarea
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('task_submissions')
        .select(`
          id,
          student_id,
          content,
          attachment_url,
          attachment_name,
          attachment_size,
          submission_date,
          grade,
          grade_letter,
          feedback,
          status
        `)
        .eq('assignment_id', selectedAssignment.id)
        .order('submission_date', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Obtener información de estudiantes
      if (submissionsData && submissionsData.length > 0) {
        const studentIds = submissionsData.map((s: any) => s.student_id);

        const { data: studentsData } = await supabase
          .from('students')
          .select('id, student_code, first_name, last_name')
          .in('id', studentIds);

        const enrichedSubmissions = submissionsData.map((sub: any) => {
          const student = studentsData?.find((s: any) => s.id === sub.student_id);
          return {
            ...sub,
            student_name: student ? `${student.first_name} ${student.last_name}` : 'Estudiante',
            student_code: student?.student_code || '---',
          };
        });

        setSubmissions(enrichedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleGradeClick(submission: Submission) {
    setGradingSubmission(submission);
    setShowGradeModal(true);
  }

  function handleGradeSuccess() {
    loadSubmissions();
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'graded':
        return <Badge variant="success">Calificada</Badge>;
      case 'submitted':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'returned':
        return <Badge variant="info">Devuelta</Badge>;
      case 'draft':
        return <Badge variant="default">Borrador</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  }

  const useLiteralGrade = selectedAssignment?.section.grade_level.level === 'primaria';

  if (loading && !selectedAssignment) {
    return <Loading fullScreen text="Cargando tareas..." />;
  }

  // Vista: Seleccionar tarea
  if (!selectedAssignment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Calificar Tareas</h1>
          <p className="text-[#334155]">Selecciona una tarea para ver y calificar las entregas</p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-[#334155]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                  No tienes tareas asignadas
                </h3>
                <p className="text-[#334155]">
                  Crea tareas desde la sección de Tareas para poder calificar entregas
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
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{assignment.course.code}</Badge>
                        <span className="text-sm text-[#334155]">{assignment.course.name}</span>
                        <span className="text-sm text-[#64748B]">•</span>
                        <span className="text-sm text-[#64748B]">
                          {assignment.section.grade_level.name} - {assignment.section.name}
                        </span>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-[#334155] mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-[#334155]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Límite: {new Date(assignment.due_date).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Puntaje: {assignment.max_score}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      icon={<CheckCircle2 />}
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      Ver Entregas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista: Lista de entregas de la tarea seleccionada
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft />}
          variant="outline"
          onClick={() => {
            setSelectedAssignment(null);
            setSubmissions([]);
          }}
        >
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#0F172A]">{selectedAssignment.title}</h1>
          <p className="text-sm text-[#64748B]">
            {selectedAssignment.course.code} - {selectedAssignment.section.grade_level.name} {selectedAssignment.section.name}
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#334155]">Total Entregas</p>
                <p className="text-3xl font-bold text-[#0F172A]">{submissions.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#334155]">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {submissions.filter((s) => s.status === 'submitted').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#334155]">Calificadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {submissions.filter((s) => s.status === 'graded').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de entregas */}
      {loading ? (
        <Loading text="Cargando entregas..." />
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay entregas aún
              </h3>
              <p className="text-[#334155]">
                Los estudiantes aún no han entregado trabajos para esta tarea
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Card key={submission.id} variant="bordered">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[#0F172A]">{submission.student_name}</h3>
                      <Badge variant="default">{submission.student_code}</Badge>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#64748B]">
                      <span>
                        Entregado: {new Date(submission.submission_date).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {submission.attachment_url && (
                        <a
                          href={submission.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                          Descargar archivo
                        </a>
                      )}
                      {submission.status === 'graded' && submission.grade !== null && (
                        <span className="font-semibold text-green-600">
                          Nota: {submission.grade_letter} ({submission.grade}/20)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(submission.status === 'submitted' || submission.status === 'returned') && (
                      <Button
                        icon={<CheckCircle2 />}
                        size="sm"
                        onClick={() => handleGradeClick(submission)}
                      >
                        Calificar
                      </Button>
                    )}
                    {submission.status === 'graded' && (
                      <Button
                        icon={<CheckCircle2 />}
                        variant="outline"
                        size="sm"
                        onClick={() => handleGradeClick(submission)}
                      >
                        Ver / Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de calificación */}
      {gradingSubmission && (
        <GradeSubmissionModal
          isOpen={showGradeModal}
          onClose={() => {
            setShowGradeModal(false);
            setGradingSubmission(null);
          }}
          submission={gradingSubmission}
          maxScore={selectedAssignment.max_score}
          useLiteralGrade={useLiteralGrade}
          onSuccess={handleGradeSuccess}
        />
      )}
    </div>
  );
}
