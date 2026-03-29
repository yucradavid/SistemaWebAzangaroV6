import { useState, useEffect } from 'react';
import { Lock, Unlock, BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { Input } from '../../components/ui/Input';

interface Period {
  id: string;
  name: string;
  period_number: number;
  is_closed: boolean;
  start_date: string;
  end_date: string;
}

interface CourseStats {
  course_id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  grade_level: string;
  total_students: number;
  students_with_grades: number;
  is_published: boolean;
  teacher_name: string;
}

export function EvaluationReviewPage() {
  const { profile } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [stats, setStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadStats();
    }
  }, [selectedPeriod]);

  async function loadPeriods() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('periods')
        .select('id, name, period_number, is_closed, start_date, end_date')
        .order('period_number', { ascending: false });

      if (error) throw error;

      setPeriods(data || []);
      if (data && data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      setLoading(true);

      // Cargar asignaciones de cursos (que relaciona cursos con secciones)
      const { data: assignments, error: coursesError } = await supabase
        .from('teacher_course_assignments')
        .select(`
          id,
          course_id,
          section_id,
          course:courses(id, code, name),
          section:sections(
            id,
            section_letter,
            grade_level:grade_levels(name, grade)
          ),
          teacher:teachers(
            first_name,
            last_name
          )
        `)
        .eq('academic_year_id', (await supabase.from('academic_years').select('id').eq('is_active', true).single()).data?.id || '');

      if (coursesError) throw coursesError;

      // Para cada asignación, obtener estadísticas de evaluación
      const statsPromises = (assignments || []).map(async (assignment) => {
        // Total de estudiantes en la sección
        const { count: totalStudents } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('section_id', assignment.section_id);

        // Obtener competencias del curso
        const { data: competencies } = await supabase
          .from('competencies')
          .select('id')
          .eq('course_id', assignment.course_id);

        const competencyIds = competencies?.map((c) => c.id) || [];

        // Estudiantes que tienen al menos una evaluación publicada
        const { data: evaluations } = await supabase
          .from('evaluations')
          .select('student_id, status')
          .eq('course_id', assignment.course_id)
          .eq('period_id', selectedPeriod)
          .in('competency_id', competencyIds);

        // Contar estudiantes únicos con evaluaciones
        const studentsWithGrades = new Set(
          evaluations?.filter((e) => e.status === 'publicada').map((e) => e.student_id)
        ).size;

        // Verificar si todas las evaluaciones están publicadas
        const allPublished =
          evaluations?.length > 0 &&
          evaluations.every((e) => e.status === 'publicada') &&
          studentsWithGrades === totalStudents;

        const teacherName = assignment.teacher
          ? `${assignment.teacher.first_name} ${assignment.teacher.last_name}`
          : 'Sin asignar';

        return {
          course_id: assignment.course.id,
          course_code: assignment.course.code,
          course_name: assignment.course.name,
          section_name: `${assignment.section.grade_level.grade}° ${assignment.section.section_letter}`,
          grade_level: assignment.section.grade_level.name,
          total_students: totalStudents || 0,
          students_with_grades: studentsWithGrades,
          is_published: allPublished,
          teacher_name: teacherName,
        };
      });

      const statsData = await Promise.all(statsPromises);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClosePeriod() {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('periods')
        .update({ is_closed: true })
        .eq('id', selectedPeriod);

      if (error) throw error;

      alert('Periodo cerrado exitosamente');
      setShowCloseModal(false);
      loadPeriods();
      loadStats();
    } catch (error) {
      console.error('Error closing period:', error);
      alert('Error al cerrar el periodo');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopenPeriod() {
    if (!reopenReason.trim()) {
      alert('Debe proporcionar una razón para reabrir el periodo');
      return;
    }

    try {
      setActionLoading(true);

      // TODO: Registrar en tabla de auditoría la razón de reapertura
      const { error } = await supabase
        .from('periods')
        .update({ is_closed: false })
        .eq('id', selectedPeriod);

      if (error) throw error;

      alert(`Periodo reabierto exitosamente.\nRazón: ${reopenReason}`);
      setShowReopenModal(false);
      setReopenReason('');
      loadPeriods();
      loadStats();
    } catch (error) {
      console.error('Error reopening period:', error);
      alert('Error al reabrir el periodo');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && periods.length === 0) {
    return <Loading fullScreen text="Cargando información..." />;
  }

  const currentPeriod = periods.find((p) => p.id === selectedPeriod);
  const totalCourses = stats.length;
  const publishedCourses = stats.filter((s) => s.is_published).length;
  const pendingCourses = totalCourses - publishedCourses;
  const completionRate = totalCourses > 0 ? (publishedCourses / totalCourses) * 100 : 0;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Gestión de Evaluaciones</h1>
        <p className="text-[#334155]">Revisa el avance y cierra periodos académicos</p>
      </div>

      {/* Selector de periodo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                label="Periodo académico"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.start_date} - {period.end_date})
                  </option>
                ))}
              </Select>
            </div>
            {currentPeriod && (
              <div className="pt-6">
                {currentPeriod.is_closed ? (
                  <Badge variant="error">
                    <Lock className="w-4 h-4 mr-1" />
                    Periodo Cerrado
                  </Badge>
                ) : (
                  <Badge variant="success">
                    <Unlock className="w-4 h-4 mr-1" />
                    Periodo Abierto
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas generales */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-[#0E3A8A]" />
              <span className="text-3xl font-bold text-[#0F172A]">{totalCourses}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Total de Cursos</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{publishedCourses}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Cursos Completados</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-yellow-600">{pendingCourses}</span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Cursos Pendientes</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-[#0E3A8A]" />
              <span className="text-3xl font-bold text-[#0F172A]">
                {completionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-[#334155] font-medium">Avance General</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      {currentPeriod && (
        <div className="flex gap-4">
          {!currentPeriod.is_closed ? (
            <Button
              icon={<Lock />}
              variant="error"
              onClick={() => setShowCloseModal(true)}
              disabled={pendingCourses > 0}
            >
              Cerrar Periodo
            </Button>
          ) : (
            <Button
              icon={<Unlock />}
              variant="warning"
              onClick={() => setShowReopenModal(true)}
            >
              Reabrir Periodo
            </Button>
          )}
        </div>
      )}

      {pendingCourses > 0 && !currentPeriod?.is_closed && (
        <Card variant="error">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#0F172A] mb-1">
                  No se puede cerrar el periodo
                </p>
                <p className="text-sm text-[#334155]">
                  Aún hay {pendingCourses} curso(s) con evaluaciones pendientes de publicación.
                  Todos los cursos deben tener sus calificaciones publicadas antes de cerrar el
                  periodo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de cursos */}
      {loading ? (
        <Loading text="Cargando estadísticas..." />
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-[#0F172A]">Estado por Curso</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E2E8F0]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Curso
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Sección
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Docente
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Estudiantes
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Calificados
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.course_id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-[#0F172A]">{stat.course_name}</p>
                          <p className="text-xs text-[#334155]">{stat.course_code}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-[#0F172A]">{stat.section_name}</p>
                          <p className="text-xs text-[#334155]">{stat.grade_level}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-[#0F172A]">{stat.teacher_name}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-[#0F172A]">
                          {stat.total_students}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-[#0F172A]">
                          {stat.students_with_grades}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stat.is_published ? (
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Confirmar cierre */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Cerrar Periodo"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#0F172A] mb-1">¿Está seguro?</p>
              <p className="text-sm text-[#334155]">
                Al cerrar el periodo, los docentes no podrán modificar las calificaciones. Esta
                acción bloqueará todas las evaluaciones del periodo <strong>{currentPeriod?.name}</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="error"
              onClick={handleClosePeriod}
              loading={actionLoading}
              icon={<Lock />}
            >
              Confirmar Cierre
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reabrir periodo */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Reabrir Periodo"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#0F172A] mb-1">Reabrir periodo cerrado</p>
              <p className="text-sm text-[#334155]">
                Esta acción permitirá que los docentes vuelvan a editar las calificaciones del
                periodo <strong>{currentPeriod?.name}</strong>. Debe proporcionar una razón para la
                reapertura.
              </p>
            </div>
          </div>

          <Input
            label="Razón de reapertura *"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Ej: Corrección de errores administrativos"
          />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowReopenModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="warning"
              onClick={handleReopenPeriod}
              loading={actionLoading}
              icon={<Unlock />}
            >
              Confirmar Reapertura
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
