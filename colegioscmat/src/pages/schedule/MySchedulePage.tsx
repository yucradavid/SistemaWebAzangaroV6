import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, Users, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { GoBackButton } from '../../components/ui/GoBackButton';
import type { DayOfWeek } from '../../lib/database.types';

interface Schedule {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string | null;
  course: {
    name: string;
    code: string;
    color: string;
  };
  section: {
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
}

interface StudentRef {
  id: string;
  first_name: string;
  last_name: string;
  section_id: string;
  grade_name: string;
  section_letter: string;
}

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

const TIME_SLOTS = [
  '07:00', '07:45', '08:30', '09:15', '10:00', '10:45',
  '11:30', '12:15', '13:00', '13:45', '14:30', '15:15', '16:00'
];

// Altura total del calendario en píxeles (basado en duración)
// De 7:00 (0 min) a 17:00 (600 min)
const TOTAL_MINUTES = 600;
const PIXELS_PER_MINUTE = 1.8;

// Función auxiliar para convertir hora (HH:mm) a minutos desde las 7:00 AM
function getMinutesFromStart(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours - 7) * 60 + minutes;
}

export function MySchedulePage() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  // Estados para modo Apoderado
  const [guardianStudents, setGuardianStudents] = useState<StudentRef[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadInitialData();
    }
  }, [profile?.id]);

  // Efecto para recargar horario cuando cambia el estudiante seleccionado (solo para apoderados)
  useEffect(() => {
    if (profile?.role === 'guardian' && selectedStudentId) {
      const student = guardianStudents.find(s => s.id === selectedStudentId);
      if (student) {
        loadScheduleForSection(student.section_id);
      }
    }
  }, [selectedStudentId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError('');

      // 1. Verificar año académico activo
      const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeYear) {
        setError('No hay año académico activo');
        setLoading(false);
        return;
      }

      // 2. Lógica según rol
      if (profile?.role === 'teacher') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (!teacher) {
          setError('No se encontró el registro de docente');
          setLoading(false);
          return;
        }

        await loadScheduleForTeacher(teacher.id, activeYear.id);

      } else if (profile?.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('section_id')
          .eq('user_id', profile.id)
          .single();

        if (!student || !student.section_id) {
          setError('NO_SECTION');
          setLoading(false);
          return;
        }

        await loadScheduleForSection(student.section_id, activeYear.id);

      } else if (profile?.role === 'guardian') {
        // Cargar hijos asociados
        const { data: guardians } = await supabase
          .from('guardians')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (!guardians) {
          setError('No se encontró perfil de apoderado');
          setLoading(false);
          return;
        }

        const { data: relations } = await supabase
          .from('student_guardians')
          .select(`
            student:students (
              id,
              first_name,
              last_name,
              section_id,
              sections (
                section_letter,
                grade_levels (name)
              )
            )
          `)
          .eq('guardian_id', guardians.id);

        const students: StudentRef[] = (relations || [])
          .map((r: any) => {
            if (!r.student || !r.student.section_id) return null;
            return {
              id: r.student.id,
              first_name: r.student.first_name,
              last_name: r.student.last_name,
              section_id: r.student.section_id,
              grade_name: r.student.sections?.grade_levels?.name || '',
              section_letter: r.student.sections?.section_letter || ''
            };
          })
          .filter(Boolean) as StudentRef[];

        setGuardianStudents(students);

        if (students.length === 0) {
          setError('No tienes hijos con sección asignada');
          setLoading(false);
        } else {
          // Seleccionar el primer hijo por defecto
          setSelectedStudentId(students[0].id);
          // La carga del horario se disparará por el useEffect dependiente de selectedStudentId
        }
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar la información');
      setLoading(false);
    }
  }

  async function loadScheduleForTeacher(teacherId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('course_schedules')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          course:courses(name, code, color),
          section:sections(
            section_letter,
            grade_level:grade_levels(name)
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', academicYearId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar horario docente');
    } finally {
      setLoading(false);
    }
  }

  async function loadScheduleForSection(sectionId: string, academicYearId?: string) {
    try {
      setLoading(true); // Mostrar carga al cambiar de hijo

      let yearId = academicYearId;
      if (!yearId) {
        const { data } = await supabase.from('academic_years').select('id').eq('is_active', true).single();
        yearId = data?.id;
      }

      if (!yearId) return;

      const { data, error } = await supabase
        .from('course_schedules')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          course:courses(name, code, color),
          section:sections(
            section_letter,
            grade_level:grade_levels(name)
          )
        `)
        .eq('section_id', sectionId)
        .eq('academic_year_id', yearId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar horario');
    } finally {
      setLoading(false);
    }
  }

  function renderWeekView() {
    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <div className="min-w-[700px] relative bg-white" style={{ height: `${TOTAL_MINUTES * PIXELS_PER_MINUTE}px` }}>

          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-[60px_repeat(6,1fr)]">
            <div className="bg-slate-50 border-r border-slate-200"></div>
            {DAYS.map((day, index) => (
              <div key={day.value} className={`border-r border-slate-100 ${index === DAYS.length - 1 ? 'border-r-0' : ''}`} />
            ))}
          </div>

          {/* Time Labels */}
          {TIME_SLOTS.map((time) => {
            const minutes = getMinutesFromStart(time);
            return (
              <div key={time} className="absolute w-full flex items-center group pointer-events-none" style={{ top: `${minutes * PIXELS_PER_MINUTE}px` }}>
                <div className="w-[60px] text-[10px] text-slate-400 font-medium text-right pr-2 -mt-2">{time}</div>
                <div className="flex-1 border-t border-slate-100 group-hover:border-blue-100 transition-colors" />
              </div>
            );
          })}

          {/* Header (Days) */}
          <div className="sticky top-0 z-20 grid grid-cols-[60px_repeat(6,1fr)] bg-[#0E3A8A] text-white shadow-md">
            <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center bg-[#0B2C67]">Hora</div>
            {DAYS.map(day => (
              <div key={day.value} className="p-2 text-xs font-semibold text-center border-l border-white/10">{day.label}</div>
            ))}
          </div>

          {/* Schedule Blocks */}
          <div className="absolute inset-x-0 w-full grid grid-cols-[60px_repeat(6,1fr)] pointer-events-none">
            <div></div>
            {DAYS.map(day => {
              const daySchedules = schedules.filter(s => s.day_of_week === day.value);
              return (
                <div key={day.value} className="relative h-full pointer-events-auto">
                  {daySchedules.map((schedule) => {
                    const startMin = getMinutesFromStart(schedule.start_time);
                    const endMin = getMinutesFromStart(schedule.end_time);
                    const duration = endMin - startMin;

                    return (
                      <div
                        key={schedule.id}
                        className="absolute inset-x-1 rounded-md p-1.5 text-white shadow-sm overflow-hidden transition-all hover:shadow-md hover:ring-2 hover:ring-white/50 z-10"
                        style={{
                          top: `${startMin * PIXELS_PER_MINUTE}px`,
                          height: `${duration * PIXELS_PER_MINUTE}px`,
                          backgroundColor: schedule.course.color
                        }}
                      >
                        <div className="font-bold text-[11px] truncate leading-tight">
                          {schedule.course.name}
                        </div>
                        {duration >= 45 && (
                          <div className="text-[10px] opacity-90 flex items-center gap-1 mt-0.5 truncate">
                            <Clock className="w-2.5 h-2.5" />
                            {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                          </div>
                        )}
                        {duration >= 60 && schedule.room_number && (
                          <div className="text-[10px] opacity-90 flex items-center gap-1 truncate">
                            <MapPin className="w-2.5 h-2.5" />
                            {schedule.room_number}
                          </div>
                        )}
                        {duration >= 75 && profile?.role === 'teacher' && (
                          <div className="text-[10px] opacity-90 border-t border-white/20 mt-1 pt-1 truncate">
                            {schedule.section.grade_level.name} - {schedule.section.section_letter}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderListView() {
    return (
      <div className="space-y-6">
        {DAYS.map(day => {
          const daySchedules = schedules
            .filter(s => s.day_of_week === day.value)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          if (daySchedules.length === 0) return null;

          return (
            <div key={day.value} className="space-y-3">
              <h3 className="text-xl font-bold text-[#0E3A8A] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {day.label}
              </h3>
              <div className="grid gap-3">
                {daySchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-4 p-4 rounded-xl text-white shadow-md hover:shadow-lg transition-shadow"
                    style={{ backgroundColor: schedule.course.color }}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-lg">{schedule.course.name}</div>
                      <div className="text-sm opacity-90">{schedule.course.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end font-semibold">
                        <Clock className="w-4 h-4" />
                        {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                      </div>
                      {schedule.room_number && (
                        <div className="flex items-center gap-1 justify-end text-sm opacity-90 mt-1">
                          <MapPin className="w-3 h-3" />
                          {schedule.room_number}
                        </div>
                      )}
                      {profile?.role === 'teacher' && (
                        <div className="text-sm opacity-90 mt-1">
                          {schedule.section.grade_level.name} - {schedule.section.section_letter}
                        </div>
                      )}
                      {profile?.role === 'guardian' && (
                        <div className="text-sm opacity-90 mt-1">
                          {schedule.section.grade_level.name} - {schedule.section.section_letter}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (loading && schedules.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <GoBackButton />
          <h1 className="text-3xl font-bold text-[#0E3A8A] mt-2">Mi Horario</h1>
          <p className="text-slate-600">
            {profile?.role === 'teacher' && 'Horario de tus clases asignadas'}
            {profile?.role === 'student' && 'Horario de tus clases'}
            {profile?.role === 'guardian' && 'Consulta el horario escolar de tus hijos'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'week'
              ? 'bg-[#0E3A8A] text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
          >
            Vista Semanal
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'list'
              ? 'bg-[#0E3A8A] text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
          >
            Vista Lista
          </button>
        </div>
      </div>

      {/* Selector de Hijos (Solo Apoderados) */}
      {profile?.role === 'guardian' && guardianStudents.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-[#0E3A8A]" />
            <span className="font-semibold text-slate-700">Seleccionar Estudiante:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {guardianStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${selectedStudentId === student.id
                    ? 'bg-[#0E3A8A] text-white border-[#0E3A8A] shadow-md ring-2 ring-blue-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-[#0E3A8A]'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedStudentId === student.id ? 'bg-white text-[#0E3A8A]' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold leading-none">{student.first_name}</div>
                  <div className="text-[10px] opacity-90 leading-none mt-1">
                    {student.grade_name} {student.section_letter}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error === 'NO_SECTION' ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No estás asignado a una sección
              </h3>
              <p className="text-slate-500 mb-4 max-w-md mx-auto">
                Tu cuenta de estudiante aún no ha sido asignada a una sección académica.
                Por favor, contacta a la administración del colegio para completar tu registro.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>¿Qué hacer?</strong><br />
                  Comunícate con secretaría académica o tu tutor para que te asignen a la sección correspondiente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!error && schedules.length === 0 && !loading && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">
                No hay clases programadas para {profile?.role === 'guardian' ? 'este estudiante' : 'ti'} en este momento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && schedules.length > 0 && (
        <Card>
          <CardContent>
            {viewMode === 'week' ? renderWeekView() : renderListView()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
