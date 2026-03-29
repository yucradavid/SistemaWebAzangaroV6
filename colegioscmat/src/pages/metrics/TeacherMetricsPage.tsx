import { useState, useEffect } from 'react';
import { Calendar, Users, ClipboardCheck, BookOpen, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { supabase } from '../../lib/supabase';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface CourseAssignment {
    id: string;
    course_id: string;
    section_id: string;
    courses: {
        name: string;
        code: string;
    };
    sections: {
        section_letter: string;
        grade: number;
        grade_levels: {
            name: string;
        };
    };
}

export function TeacherMetricsPage() {
    const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);
    const [averageAttendance, setAverageAttendance] = useState(0);

    useEffect(() => {
        loadTeacherData();
    }, []);

    async function loadTeacherData() {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'teacher') {
                setLoading(false);
                return;
            }

            const { data: teacher } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (!teacher) {
                setLoading(false);
                return;
            }

            const { data: activeYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_active', true)
                .single();

            if (!activeYear) return;

            const { data: assignmentsData } = await supabase
                .from('teacher_course_assignments')
                .select(`
          id,
          course_id,
          section_id,
          courses (
            name,
            code
          ),
          sections (
            section_letter,
            grade_levels!inner (
              name,
              grade
            )
          )
        `)
                .eq('teacher_id', teacher.id)
                .eq('academic_year_id', activeYear.id);

            setAssignments(assignmentsData || []);

            if (assignmentsData && assignmentsData.length > 0) {
                const courseIds = assignmentsData.map(a => a.course_id);
                const sectionIds = assignmentsData.map(a => a.section_id);

                const { count: enrollmentsCount } = await supabase
                    .from('student_course_enrollments')
                    .select('id', { count: 'exact', head: true })
                    .in('course_id', courseIds)
                    .in('section_id', sectionIds)
                    .eq('academic_year_id', activeYear.id);

                setTotalStudents(enrollmentsCount || 0);

                const { data: assignmentsIds } = await supabase
                    .from('assignments')
                    .select('id')
                    .in('course_id', courseIds);

                if (assignmentsIds && assignmentsIds.length > 0) {
                    const assignmentIdsList = assignmentsIds.map(a => a.id);

                    const { count: tasksCount } = await supabase
                        .from('task_submissions')
                        .select('id', { count: 'exact', head: true })
                        .in('assignment_id', assignmentIdsList)
                        .eq('status', 'submitted');

                    if (tasksCount !== null) {
                        setPendingTasks(tasksCount);
                    }
                }

                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('status')
                    .in('course_id', courseIds);

                if (attendanceData && attendanceData.length > 0) {
                    const presentCount = attendanceData.filter(a => a.status === 'present').length;
                    const totalCount = attendanceData.length;
                    const avgAttendance = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                    setAverageAttendance(avgAttendance);
                }
            }
        } catch (error) {
            console.error('Error loading teacher data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <GoBackButton />
            <div>
                <h1 className="text-3xl font-bold text-cermat-blue-dark mb-2">Resumen Académico</h1>
                <p className="text-slate-600">Métricas de tus cursos asignados</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                <Card variant="elevated" className="border-t-4 border-[#0E3A8A]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{assignments.length}</span>
                            <BookOpen className="w-8 h-8 text-[#0E3A8A]" />
                        </div>
                        <p className="text-sm text-[#334155]">Cursos asignados</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#1D4ED8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{totalStudents}</span>
                            <Users className="w-8 h-8 text-[#1D4ED8]" />
                        </div>
                        <p className="text-sm text-[#334155]">Estudiantes</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#C81E1E]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{pendingTasks}</span>
                            <AlertCircle className="w-8 h-8 text-[#C81E1E]" />
                        </div>
                        <p className="text-sm text-[#334155]">Tareas pendientes</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{averageAttendance > 0 ? `${averageAttendance}%` : '0%'}</span>
                            <ClipboardCheck className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-sm text-[#334155]">Asistencia promedio</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Mis Cursos Asignados</h3>
                            <BookOpen className="w-5 h-5 text-[#334155]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assignments.length === 0 ? (
                            <p className="text-sm text-[#64748B] text-center py-8">
                                No tienes cursos asignados actualmente
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-start gap-4 p-4 bg-[#F1F5F9] rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-semibold text-[#0F172A]">{assignment.courses.name}</p>
                                            <p className="text-sm text-[#334155]">
                                                {assignment.sections.grade_levels.name} - Sección {assignment.sections.section_letter}
                                            </p>
                                            <p className="text-xs text-[#64748B]">Código: {assignment.courses.code}</p>
                                        </div>
                                        <Badge variant="info">{assignment.sections.grade_levels.grade}º</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Información</h3>
                            <AlertCircle className="w-5 h-5 text-[#334155]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                    <strong>Cursos asignados:</strong> {assignments.length} de 6 máximo
                                </p>
                            </div>
                            {assignments.length === 0 && (
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-900">
                                        Aún no tienes cursos asignados. Contacta al administrador para recibir tus asignaciones.
                                    </p>
                                </div>
                            )}
                            {assignments.length > 0 && (
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-900">
                                        Puedes ver y gestionar tus cursos desde los módulos de Asistencia, Evaluaciones y Tareas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
