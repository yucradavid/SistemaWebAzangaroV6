import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Assignment {
    id: string;
    title: string;
    due_date: string;
    course: { name: string };
    submission: any;
}

// Interface removed as it is currently unused
// interface Grade { ... }

interface AttendanceStats {
    presente: number;
    tarde: number;
    falta: number;
    total: number;
}

export function StudentMetricsPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<{
        today: Assignment[];
        thisWeek: Assignment[];
        overdue: Assignment[];
    }>({ today: [], thisWeek: [], overdue: [] });
    // const [recentGrades, setRecentGrades] = useState<Grade[]>([]); // Removing unused state
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
        presente: 0,
        tarde: 0,
        falta: 0,
        total: 0,
    });

    useEffect(() => {
        if (profile?.id) {
            loadDashboardData();
        }
    }, [profile?.id]);

    async function loadDashboardData() {
        try {
            setLoading(true);

            if (!profile?.id) return;

            const { data: studentData } = await supabase
                .from('students')
                .select('id, section_id')
                .eq('user_id', profile.id)
                .maybeSingle() as { data: { id: string; section_id: string } | null; error: any };

            if (!studentData) {
                setLoading(false);
                return;
            }

            const { data: activeYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_active', true)
                .single() as { data: { id: string } | null; error: any };

            if (!activeYear) {
                setLoading(false);
                return;
            }

            const { data: enrollments } = await supabase
                .from('student_course_enrollments')
                .select('course_id, section_id')
                .eq('student_id', studentData.id)
                .eq('academic_year_id', activeYear.id) as { data: any[]; error: any };

            if (!enrollments || enrollments.length === 0) {
                setLoading(false);
                return;
            }

            const courseIds = enrollments.map(e => e.course_id);
            const sectionIds = enrollments.map(e => e.section_id);

            const { data: assignmentsData } = await supabase
                .from('assignments')
                .select(`
          id,
          title,
          due_date,
          course:courses(name)
        `)
                .in('course_id', courseIds)
                .in('section_id', sectionIds)
                .order('due_date', { ascending: true }) as { data: any[]; error: any };

            const { data: submissions } = await supabase
                .from('assignment_submissions')
                .select('assignment_id, status')
                .eq('student_id', studentData.id) as { data: any[]; error: any };

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);

            const categorized = {
                today: [] as Assignment[],
                thisWeek: [] as Assignment[],
                overdue: [] as Assignment[],
            };

            (assignmentsData || []).forEach((assignment: any) => {
                const dueDate = new Date(assignment.due_date);
                const submission = submissions?.find(s => s.assignment_id === assignment.id);
                const enriched = { ...assignment, submission };

                if (!submission || submission.status === 'draft') {
                    if (dueDate < now) {
                        categorized.overdue.push(enriched);
                    } else if (dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
                        categorized.today.push(enriched);
                    } else if (dueDate <= weekFromNow) {
                        categorized.thisWeek.push(enriched);
                    }
                }
            });

            setAssignments(categorized);
            // setRecentGrades([]);

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', studentData.id) as { data: any[]; error: any };

            const stats = {
                presente: 0,
                tarde: 0,
                falta: 0,
                total: attendanceData?.length || 0,
            };

            (attendanceData || []).forEach((record: any) => {
                if (record.status === 'presente') stats.presente++;
                else if (record.status === 'tarde') stats.tarde++;
                else if (record.status === 'falta') stats.falta++;
            });

            setAttendanceStats(stats);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays === -1) return 'Ayer';
        if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días`;
        return `En ${diffDays} días`;
    }

    function getAttendancePercentage(): number {
        if (attendanceStats.total === 0) return 0;
        return Math.round((attendanceStats.presente / attendanceStats.total) * 100);
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <GoBackButton />
            <div>
                <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Mi Portal Académico</h1>
                <p className="text-[#334155]">Métricas de tu desempeño</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                <Card variant="elevated" className="border-t-4 border-[#C81E1E]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{assignments.overdue.length}</span>
                            <AlertCircle className="w-8 h-8 text-[#C81E1E]" />
                        </div>
                        <p className="text-sm text-[#334155]">Tareas atrasadas</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#D97706]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{assignments.today.length}</span>
                            <Clock className="w-8 h-8 text-[#D97706]" />
                        </div>
                        <p className="text-sm text-[#334155]">Para hoy</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#1D4ED8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{assignments.thisWeek.length}</span>
                            <Calendar className="w-8 h-8 text-[#1D4ED8]" />
                        </div>
                        <p className="text-sm text-[#334155]">Esta semana</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">
                                {getAttendancePercentage()}%
                            </span>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-sm text-[#334155]">Asistencia</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Mis tareas</h3>
                            <BookOpen className="w-5 h-5 text-[#334155]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assignments.overdue.length === 0 && assignments.today.length === 0 && assignments.thisWeek.length === 0 ? (
                            <p className="text-sm text-[#64748B] text-center py-8">
                                No tienes tareas pendientes
                            </p>
                        ) : (
                            <>
                                {assignments.overdue.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="w-4 h-4 text-[#C81E1E]" />
                                            <p className="text-sm font-semibold text-[#C81E1E]">Atrasadas</p>
                                        </div>
                                        <div className="space-y-3">
                                            {assignments.overdue.map((task) => (
                                                <div key={task.id} className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-[#0F172A]">{task.title}</p>
                                                            <p className="text-sm text-[#334155]">{task.course.name}</p>
                                                        </div>
                                                        <Badge variant="error">{formatDate(task.due_date)}</Badge>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        fullWidth
                                                        className="mt-2"
                                                        onClick={() => navigate('/tasks/student')}
                                                    >
                                                        Entregar ahora
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {assignments.today.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="w-4 h-4 text-[#D97706]" />
                                            <p className="text-sm font-semibold text-[#D97706]">Hoy</p>
                                        </div>
                                        <div className="space-y-3">
                                            {assignments.today.map((task) => (
                                                <div key={task.id} className="p-4 bg-[#F1F5F9] rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-[#0F172A]">{task.title}</p>
                                                            <p className="text-sm text-[#334155]">
                                                                {task.course.name} • Vence {formatDate(task.due_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        fullWidth
                                                        className="mt-2"
                                                        onClick={() => navigate('/tasks/student')}
                                                    >
                                                        Ver detalles
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {assignments.thisWeek.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="w-4 h-4 text-[#1D4ED8]" />
                                            <p className="text-sm font-semibold text-[#1D4ED8]">Esta semana</p>
                                        </div>
                                        <div className="space-y-3">
                                            {assignments.thisWeek.map((task) => (
                                                <div key={task.id} className="p-4 bg-[#F1F5F9] rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-[#0F172A]">{task.title}</p>
                                                            <p className="text-sm text-[#334155]">
                                                                {task.course.name} • {formatDate(task.due_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <Button
                            variant="outline"
                            fullWidth
                            className="mt-4"
                            onClick={() => navigate('/tasks/student')}
                        >
                            Ver todas las tareas
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-[#0F172A]">Mi asistencia</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center mb-4">
                                <p className="text-4xl font-bold text-[#0E3A8A] mb-1">
                                    {getAttendancePercentage()}%
                                </p>
                                <p className="text-sm text-[#334155]">Asistencia total</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{attendanceStats.presente}</p>
                                    <p className="text-xs text-[#334155]">Presentes</p>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-600">{attendanceStats.tarde}</p>
                                    <p className="text-xs text-[#334155]">Tardanzas</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{attendanceStats.falta}</p>
                                    <p className="text-xs text-[#334155]">Faltas</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                fullWidth
                                className="mt-4"
                                onClick={() => navigate('/attendance/student')}
                            >
                                Ver historial completo
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
