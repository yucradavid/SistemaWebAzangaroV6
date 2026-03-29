import { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { AttendanceStatus } from '../../lib/database.types';

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

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  justification: string;
  existing_id?: string;
}

export function TeacherAttendancePage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTeacherCourses();
  }, [profile]);

  useEffect(() => {
    if (selectedSection && selectedDate) {
      loadStudentsAndAttendance();
    }
  }, [selectedSection, selectedDate]);

  async function loadTeacherCourses() {
    try {
      setLoading(true);

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;

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
            course:courses(id, name, code),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name)
            )
          `)
          .eq('academic_year_id', activeYear.id)
          .order('course_id');

        if (error) throw error;
        setCourses(data || []);

        if (data && data.length > 0) {
          setSelectedCourse(data[0].course.id);
          setSelectedSection(data[0].section.id);
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
            course:courses(id, name, code),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name)
            )
          `)
          .eq('teacher_id', teacherData.id)
          .eq('academic_year_id', activeYear.id);

        if (error) throw error;
        setCourses(data || []);

        if (data && data.length > 0) {
          setSelectedCourse(data[0].course.id);
          setSelectedSection(data[0].section.id);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Error al cargar los cursos asignados');
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentsAndAttendance() {
    try {
      setLoading(true);
      setError('');

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;

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

      // Cargar asistencia existente para esta fecha/curso
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, student_id, status, justification')
        .eq('section_id', selectedSection)
        .eq('course_id', selectedCourse)
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      // Mapear asistencia existente
      const records: Record<string, AttendanceRecord> = {};
      (studentsData || []).forEach((student) => {
        const existing = (attendanceData || []).find((a) => a.student_id === student.id);
        records[student.id] = {
          student_id: student.id,
          status: existing?.status || 'presente',
          justification: existing?.justification || '',
          existing_id: existing?.id,
        };
      });

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Error al cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  }

  function updateAttendance(studentId: string, field: 'status' | 'justification', value: string) {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  }

  async function handleSaveAttendance() {
    if (!selectedCourse || !selectedSection || !selectedDate) {
      setError('Selecciona curso, sección y fecha');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const recordsToSave = Object.values(attendanceRecords);

      // Separar registros a insertar y actualizar
      const toInsert = recordsToSave.filter((r) => !r.existing_id);
      const toUpdate = recordsToSave.filter((r) => r.existing_id);

      // Insertar nuevos registros
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('attendance').insert(
          toInsert.map((r) => ({
            student_id: r.student_id,
            section_id: selectedSection,
            course_id: selectedCourse,
            date: selectedDate,
            status: r.status,
            justification: r.justification || null,
            recorded_by: profile?.id,
          })) as never
        );

        if (insertError) throw insertError;
      }

      // Actualizar registros existentes
      for (const record of toUpdate) {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            status: record.status,
            justification: record.justification || null,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', record.existing_id!);

        if (updateError) throw updateError;
      }

      setSuccess('Asistencia guardada correctamente');
      // Recargar para obtener los IDs actualizados
      await loadStudentsAndAttendance();
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error saving attendance:', error);
      setError('Error al guardar la asistencia');
    } finally {
      setSaving(false);
    }
  }

  if (loading && courses.length === 0) {
    return <Loading fullScreen text="Cargando cursos..." />;
  }

  const selectedCourseData = courses.find((c) => c.course.id === selectedCourse);

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Registro de Asistencia</h1>
          <p className="text-[#334155]">Marca la asistencia de tus estudiantes</p>
        </div>
        <Button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          icon={<Save />}
        >
          {saving ? <Loading size="sm" /> : 'Guardar asistencia'}
        </Button>
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

            <Input
              type="date"
              label="Fecha de la sesión"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              icon={<Calendar />}
            />

            {selectedCourseData && (
              <div className="flex items-end">
                <Badge variant="primary" className="text-lg py-2 px-4">
                  <Users className="w-5 h-5 mr-2" />
                  {students.length} estudiantes
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      {loading ? (
        <Loading text="Cargando estudiantes..." />
      ) : students.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Lista de Asistencia - {selectedDate}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E2E8F0]">
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">
                      Código
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">
                      Estudiante
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-[#0F172A]">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">
                      Comentario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const record = attendanceRecords[student.id];
                    return (
                      <tr key={student.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 text-[#334155]">{index + 1}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{student.student_code}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={student.first_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {student.first_name[0]}
                                  {student.last_name[0]}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-[#0F172A]">
                              {student.last_name}, {student.first_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {(['presente', 'tarde', 'falta'] as const).map((status) => (
                              <label
                                key={status}
                                className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${record?.status === status
                                    ? status === 'presente'
                                      ? 'bg-green-500 text-white'
                                      : status === 'tarde'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-red-500 text-white'
                                    : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name={`attendance-${student.id}`}
                                  value={status}
                                  checked={record?.status === status}
                                  onChange={(e) =>
                                    updateAttendance(student.id, 'status', e.target.value)
                                  }
                                  className="sr-only"
                                />
                                {status === 'presente'
                                  ? 'P'
                                  : status === 'tarde'
                                    ? 'T'
                                    : 'F'}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Comentario opcional..."
                            value={record?.justification || ''}
                            onChange={(e) =>
                              updateAttendance(student.id, 'justification', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:border-[#0E3A8A] focus:outline-none text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
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
                <Users className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                {selectedCourse && selectedSection
                  ? 'No hay estudiantes en esta sección'
                  : 'Selecciona un curso para comenzar'}
              </h3>
              <p className="text-[#334155]">
                {selectedCourse && selectedSection
                  ? 'Esta sección no tiene estudiantes matriculados'
                  : 'Elige el curso y la fecha para registrar asistencia'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
