import { useState, useEffect } from 'react';
import { Save, Send, BookOpen, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { EvaluationGrade, EvaluationStatus } from '../../lib/database.types';

interface CourseAssignment {
  id: string;
  course: {
    id: string;
    name: string;
    code: string;
  };
  section: {
    id: string;
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
}

interface Period {
  id: string;
  name: string;
  period_number: number;
  is_closed: boolean;
  academic_year: {
    year: number;
  };
}

interface Competency {
  id: string;
  code: string;
  description: string;
  order_index: number;
}

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

interface Evaluation {
  student_id: string;
  competency_id: string;
  grade: EvaluationGrade | null;
  observations: string;
  status: EvaluationStatus;
  existing_id?: string;
}

const GRADES: EvaluationGrade[] = ['AD', 'A', 'B', 'C'];

export function TeacherEvaluationPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planillaStatus, setPlanillaStatus] = useState<EvaluationStatus>('borrador');

  useEffect(() => {
    loadTeacherData();
  }, [profile]);

  useEffect(() => {
    if (selectedCourse) {
      loadCompetencies();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSection && selectedPeriod && selectedCourse && competencies.length > 0) {
      loadStudentsAndEvaluations();
    }
  }, [selectedSection, selectedPeriod, selectedCourse, competencies]);

  async function loadTeacherData() {
    try {
      setLoading(true);

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (yearError) {
        console.error('Error fetching active academic year:', yearError);
        throw yearError;
      }

      if (!activeYear) {
        console.warn('No active academic year found');
        setCourses([]);
        setError('No hay un año académico activo configurado');
        setLoading(false);
        return;
      }

      // Verificar si el usuario es admin/director/coordinator
      const isAdminRole = ['admin', 'director', 'coordinator'].includes(profile?.role || '');

      if (isAdminRole) {
        // Admin ve todos los cursos/secciones
        const { data: coursesData, error: coursesError } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            academic_year_id,
            course:courses(id, name, code),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name),
              academic_year_id
            )
          `)
          .eq('academic_year_id', activeYear.id)
          .order('course_id');

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        if (coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0].course.id);
          setSelectedSection(coursesData[0].section.id);
          await loadPeriods(activeYear.id);
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

        const { data: coursesData, error: coursesError } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            academic_year_id,
            course:courses(id, name, code),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name),
              academic_year_id
            )
          `)
          .eq('teacher_id', teacherData.id)
          .eq('academic_year_id', activeYear.id);

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        if (coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0].course.id);
          setSelectedSection(coursesData[0].section.id);
          await loadPeriods(activeYear.id);
        }
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      setError('Error al cargar los datos del docente');
    } finally {
      setLoading(false);
    }
  }

  async function loadPeriods(academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('periods')
        .select(`
          id,
          name,
          period_number,
          is_closed,
          academic_year:academic_years(year)
        `)
        .eq('academic_year_id', academicYearId)
        .order('period_number', { ascending: true });

      if (error) throw error;
      setPeriods(data || []);

      // Seleccionar el primer periodo abierto o el primero disponible
      const openPeriod = (data || []).find((p) => !p.is_closed);
      setSelectedPeriod(openPeriod?.id || data?.[0]?.id || '');
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  }

  async function loadCompetencies() {
    try {
      const { data, error } = await supabase
        .from('competencies')
        .select('id, code, description, order_index')
        .eq('course_id', selectedCourse)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCompetencies(data || []);
    } catch (error) {
      console.error('Error loading competencies:', error);
      setError('Error al cargar las competencias');
    }
  }

  async function loadStudentsAndEvaluations() {
    try {
      setLoading(true);
      setError('');

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (yearError) {
        console.error('Error fetching active academic year:', yearError);
        throw yearError;
      }

      if (!activeYear) {
        console.warn('No active academic year found');
        setError('No hay un año académico activo configurado');
        setLoading(false);
        return;
      }

      // Cargar estudiantes inscritos en este curso específico
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select(`
          students!inner (
            id,
            student_code,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('course_id', selectedCourse)
        .eq('section_id', selectedSection)
        .eq('academic_year_id', activeYear.id)
        .eq('status', 'active')
        .order('students(last_name)', { ascending: true });

      if (enrollmentsError) throw enrollmentsError;

      // Extraer estudiantes de los enrollments
      const studentsData = (enrollmentsData || []).map((e: any) => e.students);
      setStudents(studentsData);

      // Cargar evaluaciones existentes
      const studentIds = (studentsData || []).map((s) => s.id);
      const competencyIds = competencies.map((c) => c.id);

      if (studentIds.length === 0 || competencyIds.length === 0) {
        setEvaluations({});
        return;
      }

      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select('id, student_id, competency_id, grade, observations, status')
        .eq('course_id', selectedCourse)
        .eq('period_id', selectedPeriod)
        .in('student_id', studentIds)
        .in('competency_id', competencyIds);

      if (evaluationsError) throw evaluationsError;

      // Mapear evaluaciones
      const evaluationsMap: Record<string, Evaluation> = {};
      let currentStatus: EvaluationStatus = 'borrador';

      (studentsData || []).forEach((student) => {
        competencies.forEach((competency) => {
          const key = `${student.id}-${competency.id}`;
          const existing = (evaluationsData || []).find(
            (e) => e.student_id === student.id && e.competency_id === competency.id
          );

          evaluationsMap[key] = {
            student_id: student.id,
            competency_id: competency.id,
            grade: existing?.grade || null,
            observations: existing?.observations || '',
            status: existing?.status || 'borrador',
            existing_id: existing?.id,
          };

          // Determinar el estado general de la planilla
          if (existing?.status === 'publicada') {
            currentStatus = 'publicada';
          } else if (existing?.status === 'cerrada') {
            currentStatus = 'cerrada';
          }
        });
      });

      setEvaluations(evaluationsMap);
      setPlanillaStatus(currentStatus);
    } catch (error) {
      console.error('Error loading evaluations:', error);
      setError('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  }

  function updateEvaluation(
    studentId: string,
    competencyId: string,
    field: 'grade' | 'observations',
    value: any
  ) {
    const key = `${studentId}-${competencyId}`;
    setEvaluations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  }

  async function handleSaveDraft() {
    await saveEvaluations('borrador');
  }

  async function handlePublish() {
    // Validar que todos los estudiantes tengan notas en todas las competencias
    const missingGrades = Object.values(evaluations).filter((e) => !e.grade);

    if (missingGrades.length > 0) {
      setError(
        `Faltan ${missingGrades.length} calificaciones. Debes calificar todas las competencias antes de publicar.`
      );
      return;
    }

    if (
      !confirm(
        '¿Estás seguro de publicar estas calificaciones? Los estudiantes y apoderados podrán verlas.'
      )
    ) {
      return;
    }

    await saveEvaluations('publicada');
  }

  async function saveEvaluations(targetStatus: EvaluationStatus) {
    const selectedPeriodData = periods.find((p) => p.id === selectedPeriod);
    if (selectedPeriodData?.is_closed) {
      setError('El periodo está cerrado. No se pueden guardar cambios.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const evaluationsList = Object.values(evaluations);

      // Separar evaluaciones a insertar y actualizar
      const toInsert = evaluationsList.filter((e) => !e.existing_id && e.grade);
      const toUpdate = evaluationsList.filter((e) => e.existing_id);

      // Insertar nuevas evaluaciones
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('evaluations').insert(
          toInsert.map((e) => ({
            student_id: e.student_id,
            course_id: selectedCourse,
            competency_id: e.competency_id,
            period_id: selectedPeriod,
            grade: e.grade,
            observations: e.observations || null,
            status: targetStatus,
            recorded_by: profile?.id,
            published_at: targetStatus === 'publicada' ? new Date().toISOString() : null,
          })) as never
        );

        if (insertError) throw insertError;
      }

      // Actualizar evaluaciones existentes
      for (const evaluation of toUpdate) {
        const { error: updateError } = await supabase
          .from('evaluations')
          .update({
            grade: evaluation.grade,
            observations: evaluation.observations || null,
            status: targetStatus,
            published_at:
              targetStatus === 'publicada' ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', evaluation.existing_id!);

        if (updateError) throw updateError;
      }

      setPlanillaStatus(targetStatus);
      setSuccess(
        targetStatus === 'publicada'
          ? 'Calificaciones publicadas correctamente'
          : 'Borrador guardado correctamente'
      );

      // Recargar datos
      await loadStudentsAndEvaluations();
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error saving evaluations:', error);
      setError('Error al guardar las calificaciones');
    } finally {
      setSaving(false);
    }
  }

  if (loading && courses.length === 0) {
    return <Loading fullScreen text="Cargando cursos..." />;
  }

  const selectedPeriodData = periods.find((p) => p.id === selectedPeriod);
  const isPeriodClosed = selectedPeriodData?.is_closed || planillaStatus === 'cerrada';
  const isPublished = planillaStatus === 'publicada';

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Registro de Evaluaciones</h1>
          <p className="text-[#334155]">Califica a tus estudiantes por competencias</p>
        </div>
        <div className="flex gap-3">
          {!isPeriodClosed && (
            <>
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                variant="outline"
                icon={<Save />}
              >
                Guardar borrador
              </Button>
              <Button onClick={handlePublish} disabled={saving} icon={<Send />}>
                {saving ? <Loading size="sm" /> : 'Publicar calificaciones'}
              </Button>
            </>
          )}
          {isPeriodClosed && (
            <Badge variant="danger" className="text-lg py-2 px-4">
              <Lock className="w-5 h-5 mr-2" />
              Periodo cerrado
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Card variant="elevated" className="border-2 border-[#C81E1E]">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-[#C81E1E]">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card variant="elevated" className="border-2 border-green-500">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Select
              label="Curso"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                const course = courses.find((c) => c.course.id === e.target.value);
                if (course) setSelectedSection(course.section.id);
              }}
            >
              <option value="">Seleccionar curso</option>
              {courses.map((assignment) => (
                <option key={assignment.id} value={assignment.course.id}>
                  {assignment.course.code} - {assignment.course.name} (
                  {assignment.section.grade_level.name} {assignment.section.section_letter})
                </option>
              ))}
            </Select>

            <Select
              label="Periodo"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="">Seleccionar periodo</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.is_closed && '(Cerrado)'}
                </option>
              ))}
            </Select>

            <div className="flex items-end gap-2">
              {isPublished && (
                <Badge variant="success" className="text-lg py-2 px-4">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Publicada
                </Badge>
              )}
              {!isPublished && !isPeriodClosed && (
                <Badge variant="primary" className="text-lg py-2 px-4">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Borrador
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de calificaciones */}
      {loading ? (
        <Loading text="Cargando estudiantes..." />
      ) : students.length > 0 && competencies.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Planilla de Calificaciones - {selectedPeriodData?.name}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#E2E8F0]">
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A] sticky left-0 bg-white z-10">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A] sticky left-12 bg-white z-10 min-w-[200px]">
                      Estudiante
                    </th>
                    {competencies.map((competency) => (
                      <th
                        key={competency.id}
                        className="text-center py-3 px-4 font-semibold text-[#0F172A] min-w-[120px]"
                      >
                        <div className="text-xs mb-1">
                          <Badge variant="outline">{competency.code}</Badge>
                        </div>
                        <div className="text-xs text-[#334155] font-normal">
                          {competency.description.substring(0, 50)}
                          {competency.description.length > 50 && '...'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    >
                      <td className="py-3 px-4 text-[#334155] sticky left-0 bg-white">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 sticky left-12 bg-white">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.first_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {student.first_name[0]}
                                {student.last_name[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#0F172A] text-sm">
                              {student.last_name}, {student.first_name}
                            </p>
                            <p className="text-xs text-[#334155]">{student.student_code}</p>
                          </div>
                        </div>
                      </td>
                      {competencies.map((competency) => {
                        const key = `${student.id}-${competency.id}`;
                        const evaluation = evaluations[key];
                        return (
                          <td key={competency.id} className="py-3 px-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex gap-1">
                                {GRADES.map((grade) => (
                                  <button
                                    key={grade}
                                    type="button"
                                    disabled={isPeriodClosed}
                                    onClick={() =>
                                      updateEvaluation(student.id, competency.id, 'grade', grade)
                                    }
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${evaluation?.grade === grade
                                        ? grade === 'AD'
                                          ? 'bg-green-500 text-white'
                                          : grade === 'A'
                                            ? 'bg-blue-500 text-white'
                                            : grade === 'B'
                                              ? 'bg-yellow-500 text-white'
                                              : 'bg-red-500 text-white'
                                        : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                                      } ${isPeriodClosed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                  >
                                    {grade}
                                  </button>
                                ))}
                              </div>
                              {evaluation?.grade && (
                                <input
                                  type="text"
                                  placeholder="Observación..."
                                  disabled={isPeriodClosed}
                                  value={evaluation.observations}
                                  onChange={(e) =>
                                    updateEvaluation(
                                      student.id,
                                      competency.id,
                                      'observations',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-[#E2E8F0] rounded text-xs focus:border-[#0E3A8A] focus:outline-none"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                {!selectedCourse || !selectedPeriod
                  ? 'Selecciona un curso y periodo'
                  : students.length === 0
                    ? 'No hay estudiantes en esta sección'
                    : 'No hay competencias definidas para este curso'}
              </h3>
              <p className="text-[#334155]">
                {!selectedCourse || !selectedPeriod
                  ? 'Elige el curso y el periodo para comenzar a calificar'
                  : students.length === 0
                    ? 'Esta sección no tiene estudiantes matriculados'
                    : 'Debes agregar competencias en Configuración > Competencias'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
