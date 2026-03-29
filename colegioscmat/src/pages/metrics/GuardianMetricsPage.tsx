import { BookOpen, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Student {
    id: string;
    name: string;
    grade: string;
    photo: string | null;
    attendance: number;
    averageGrade: string;
    pendingPayment: number;
    recentGrades: Array<{ course: string; grade: string }>;
    assignments: number;
}

export function GuardianMetricsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadStudents();
        }
    }, [user]);

    async function loadStudents() {
        try {
            setLoading(true);

            if (!user?.id) return;

            const { data: guardianList } = await supabase
                .from('guardians')
                .select('id')
                .eq('user_id', user.id);

            if (!guardianList || guardianList.length === 0) {
                setError('No se encontró información de apoderado');
                setLoading(false);
                return;
            }

            const guardianData = guardianList[0] as { id: string };

            const { data: studentLinks, error: linksError } = await supabase
                .from('student_guardians')
                .select(`
          student:students(
            id,
            first_name,
            last_name,
            photo_url,
            section_id,
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name)
            )
          )
        `)
                .eq('guardian_id', guardianData.id) as { data: any[], error: any };

            if (linksError) throw linksError;

            const studentsData = await Promise.all(
                (studentLinks || []).map(async (link: any) => {
                    const student = link.student;
                    if (!student) return null;

                    const { data: attendanceData } = await supabase
                        .from('attendance')
                        .select('status')
                        .eq('student_id', student.id);

                    const totalDays = attendanceData?.length || 0;
                    const presentDays = attendanceData?.filter((a: any) => a.status === 'presente').length || 0;
                    const attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

                    const { data: gradesData } = await supabase
                        .from('evaluations')
                        .select(`
              grade,
              course_id
            `)
                        .eq('student_id', student.id)
                        .order('created_at', { ascending: false })
                        .limit(3) as { data: any[], error: any };

                    const recentGrades: Array<{ course: string; grade: string }> = [];
                    if (gradesData && gradesData.length > 0) {
                        for (const grade of gradesData) {
                            const { data: courseData } = await supabase
                                .from('courses')
                                .select('name')
                                .eq('id', grade.course_id)
                                .single() as { data: any, error: any };

                            recentGrades.push({
                                course: courseData?.name || 'Sin curso',
                                grade: grade.grade || '-',
                            });
                        }
                    }

                    const grades = gradesData?.map((g: any) => g.grade) || [];
                    const averageGrade = grades.length > 0 ? grades[0] : '-';

                    const { data: chargesData } = await supabase
                        .from('charges')
                        .select('final_amount, payments(amount)')
                        .eq('student_id', student.id)
                        .in('status', ['pendiente', 'vencido']);

                    let pendingPayment = 0;
                    (chargesData || []).forEach((charge: any) => {
                        const paid = (charge.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
                        pendingPayment += Math.max(0, charge.final_amount - paid);
                    });

                    const { data: assignmentsData } = await supabase
                        .from('assignments')
                        .select('id')
                        .eq('section_id', student.section?.id)
                        .gte('due_date', new Date().toISOString());

                    const assignments = assignmentsData?.length || 0;

                    return {
                        id: student.id,
                        name: `${student.first_name} ${student.last_name}`,
                        grade: `${student.section?.grade_level?.name || ''} ${student.section?.section_letter || ''}`,
                        photo: student.photo_url,
                        attendance,
                        averageGrade,
                        pendingPayment,
                        recentGrades,
                        assignments,
                    };
                })
            );

            setStudents(studentsData.filter(Boolean) as Student[]);

            if (studentsData.length === 0) {
                setError('No se pudieron cargar los datos de los estudiantes');
            }
        } catch (error: any) {
            console.error('Error loading students:', error);
            setError(`Error al cargar los datos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3A8A] mx-auto mb-4"></div>
                    <p className="text-[#334155]">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <GoBackButton />
            <div>
                <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Panel Familiar</h1>
                <p className="text-[#334155]">Monitoreo académico y financiero</p>
            </div>

            <div className="space-y-6">
                {students.map((student) => (
                    <Card key={student.id} variant="elevated">
                        <CardHeader className="bg-gradient-to-r from-[#F1F5F9] to-white">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0E3A8A] to-[#C81E1E] flex items-center justify-center text-white text-2xl font-bold">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0F172A]">{student.name}</h3>
                                        <p className="text-[#334155]">{student.grade}</p>
                                    </div>
                                </div>
                                <Badge variant={student.pendingPayment > 0 ? 'warning' : 'success'}>
                                    {student.pendingPayment > 0 ? 'Pago pendiente' : 'Al día'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid md:grid-cols-4 gap-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#0F172A]">{student.attendance}%</p>
                                        <p className="text-sm text-[#334155]">Asistencia</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#0F172A]">{student.averageGrade}</p>
                                        <p className="text-sm text-[#334155]">Promedio</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-100 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#0F172A]">{student.assignments}</p>
                                        <p className="text-sm text-[#334155]">Tareas activas</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <DollarSign className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#0F172A]">S/ {student.pendingPayment}</p>
                                        <p className="text-sm text-[#334155]">Por pagar</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-[#0F172A] mb-3">Calificaciones recientes</h4>
                                    <div className="space-y-2">
                                        {student.recentGrades.map((grade, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-[#F1F5F9] rounded-lg">
                                                <span className="text-sm text-[#334155]">{grade.course}</span>
                                                <Badge variant={grade.grade === 'AD' ? 'success' : grade.grade === 'A' ? 'info' : 'default'}>
                                                    {grade.grade}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        className="mt-3"
                                        onClick={() => navigate('/evaluation/guardian')}
                                    >
                                        Ver todas las notas
                                    </Button>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-[#0F172A] mb-3">Acciones rápidas</h4>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            icon={<BookOpen />}
                                            onClick={() => navigate('/evaluation/guardian')}
                                        >
                                            Ver calificaciones
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
