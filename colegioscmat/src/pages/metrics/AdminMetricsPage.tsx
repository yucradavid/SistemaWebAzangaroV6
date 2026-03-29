import { Users, BookOpen, DollarSign, Calendar, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { Loading } from '../../components/ui/Loading';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function AdminMetricsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        attendanceRate: 0,
        collectionRate: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            // Contar estudiantes activos
            const { count: studentsCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Contar docentes activos
            const { count: teachersCount } = await supabase
                .from('teachers')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            setStats({
                totalStudents: studentsCount || 0,
                totalTeachers: teachersCount || 0,
                attendanceRate: 92, // TODO: Calcular desde attendance_records
                collectionRate: 72, // TODO: Calcular desde financial_transactions
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <Loading />;
    }

    const gradeDistribution = [
        { grade: 'AD', count: 142, percentage: 29, color: 'bg-green-500' },
        { grade: 'A', count: 221, percentage: 45, color: 'bg-blue-500' },
        { grade: 'B', count: 98, percentage: 20, color: 'bg-amber-500' },
        { grade: 'C', count: 26, percentage: 6, color: 'bg-red-500' },
    ];

    const alerts = [
        { type: 'academic', message: '5to A - Asistencia baja esta semana (78%)', priority: 'high' },
        { type: 'finance', message: '35 familias con pagos pendientes +60 días', priority: 'high' },
        { type: 'academic', message: '12 docentes sin publicar notas del bimestre', priority: 'medium' },
        { type: 'system', message: 'Reunión de coordinación pedagógica - Viernes 10am', priority: 'low' },
    ];

    return (
        <div className="space-y-6">
            <GoBackButton />
            <div>
                <h1 className="text-3xl font-bold text-cermat-blue-dark mb-2">Métricas y Estadísticas</h1>
                <p className="text-slate-600">Vista general del rendimiento institucional</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                <Card variant="elevated" className="border-t-4 border-[#0E3A8A]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-cermat-blue-dark">{stats.totalStudents}</span>
                            <Users className="w-8 h-8 text-[#0E3A8A]" />
                        </div>
                        <p className="text-sm text-slate-600">Total estudiantes</p>
                        <p className="text-xs text-green-600 mt-1">+12 este mes</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#1D4ED8]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{stats.totalTeachers}</span>
                            <BookOpen className="w-8 h-8 text-[#1D4ED8]" />
                        </div>
                        <p className="text-sm text-[#334155]">Docentes activos</p>
                        <p className="text-xs text-[#334155] mt-1">18 nombrados, 10 contratados</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{stats.attendanceRate}%</span>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-sm text-[#334155]">Asistencia promedio</p>
                        <p className="text-xs text-green-600 mt-1">+2% vs mes anterior</p>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#C81E1E]">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-[#0F172A]">{stats.collectionRate}%</span>
                            <DollarSign className="w-8 h-8 text-[#C81E1E]" />
                        </div>
                        <p className="text-sm text-[#334155]">Cobranza mensual</p>
                        <p className="text-xs text-amber-600 mt-1">S/ 35,500 pendiente</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Distribución de calificaciones</h3>
                            <BarChart3 className="w-5 h-5 text-[#334155]" />
                        </div>
                        <p className="text-sm text-[#334155] mt-1">Bimestre actual</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {gradeDistribution.map((item) => (
                                <div key={item.grade}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                item.grade === 'AD' ? 'success' :
                                                    item.grade === 'A' ? 'info' :
                                                        item.grade === 'B' ? 'warning' : 'error'
                                            }>
                                                {item.grade}
                                            </Badge>
                                            <span className="text-sm text-[#334155]">{item.count} estudiantes</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#0F172A]">{item.percentage}%</span>
                                    </div>
                                    <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color}`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Asistencia por nivel</h3>
                            <Calendar className="w-5 h-5 text-[#334155]" />
                        </div>
                        <p className="text-sm text-[#334155] mt-1">Esta semana</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { level: 'Inicial', rate: 95, students: 85, color: 'from-blue-500 to-blue-600' },
                                { level: 'Primaria', rate: 92, students: 245, color: 'from-[#1D4ED8] to-[#0E3A8A]' },
                                { level: 'Secundaria', rate: 89, students: 157, color: 'from-[#0E3A8A] to-[#C81E1E]' },
                            ].map((item) => (
                                <div key={item.level} className={`p-4 bg-gradient-to-r ${item.color} rounded-xl text-white`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{item.level}</h4>
                                        <span className="text-2xl font-bold">{item.rate}%</span>
                                    </div>
                                    <p className="text-sm text-white/80">{item.students} estudiantes</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0F172A]">Alertas y notificaciones</h3>
                            <AlertCircle className="w-5 h-5 text-[#C81E1E]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border-l-4 ${alert.priority === 'high'
                                        ? 'bg-red-50 border-[#C81E1E]'
                                        : alert.priority === 'medium'
                                            ? 'bg-amber-50 border-amber-500'
                                            : 'bg-blue-50 border-blue-500'
                                        }`}
                                >
                                    <p className="text-sm text-[#0F172A]">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" fullWidth className="mt-4">
                            Ver todas las alertas
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Próximos eventos</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { event: 'Reunión de padres - 5to Secundaria', date: 'Viernes 15, 3:00 PM' },
                                { event: 'Entrega de libretas - Primaria', date: 'Lunes 18, Todo el día' },
                                { event: 'Capacitación docente - MINEDU', date: 'Miércoles 20, 9:00 AM' },
                            ].map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 bg-[#F1F5F9] rounded-lg">
                                    <Calendar className="w-5 h-5 text-[#0E3A8A] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-[#0F172A]">{item.event}</p>
                                        <p className="text-sm text-[#334155]">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Rendimiento semanal</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#334155]">Asistencia</span>
                                    <span className="text-sm font-bold text-green-600">92%</span>
                                </div>
                                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '92%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#334155]">Tareas entregadas</span>
                                    <span className="text-sm font-bold text-blue-600">87%</span>
                                </div>
                                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '87%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#334155]">Pagos al día</span>
                                    <span className="text-sm font-bold text-amber-600">72%</span>
                                </div>
                                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: '72%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#334155]">Comunicados leídos</span>
                                    <span className="text-sm font-bold text-[#0E3A8A]">94%</span>
                                </div>
                                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#0E3A8A]" style={{ width: '94%' }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
