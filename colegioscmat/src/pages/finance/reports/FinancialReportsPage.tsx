import { useState, useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Download,
  AlertCircle,
  FileText,
  BarChart3,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'aging' | 'collection' | 'effectiveness';

interface AcademicYear {
  id: string;
  year: string;
}

interface GradeLevel {
  id: string;
  name: string;
}

interface Section {
  id: string;
  section_letter: string;
  grade_level_id: string;
}

interface AgingStudent {
  student_id: string;
  student_name: string;
  student_code: string;
  grade: string;
  section: string;
  total_overdue: number;
  avg_days_overdue: number;
  segment: string;
  charges_count: number;
}

interface CollectionMonth {
  month: number;
  month_name: string;
  total_collected: number;
  transactions_count: number;
  avg_ticket: number;
}

interface EffectivenessMonth {
  month: number;
  month_name: string;
  total_issued: number;
  total_paid: number;
  effectiveness: number;
  difference: number;
}

export function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('aging');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Datos
  const [agingData, setAgingData] = useState<AgingStudent[]>([]);
  const [collectionData, setCollectionData] = useState<CollectionMonth[]>([]);
  const [effectivenessData, setEffectivenessData] = useState<EffectivenessMonth[]>([]);

  // KPIs
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [delinquencyRate, setDelinquencyRate] = useState(0);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      if (activeTab === 'aging') {
        loadAgingReport();
      } else if (activeTab === 'collection') {
        loadCollectionReport();
      } else if (activeTab === 'effectiveness') {
        loadEffectivenessReport();
      }
    }
  }, [activeTab, selectedYear, selectedGrade, selectedSection, selectedMonth]);

  useEffect(() => {
    if (selectedGrade) {
      loadSections(selectedGrade);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedGrade]);

  async function loadFilters() {
    try {
      // Cargar años académicos
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year')
        .eq('is_active', true)
        .order('year', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);
      if (yearsData && yearsData.length > 0) {
        setSelectedYear(yearsData[0].id);
      }

      // Cargar grados
      const { data: gradesData, error: gradesError } = await supabase
        .from('grade_levels')
        .select('id, name, level')
        .order('level');

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);
    } catch (error: any) {
      console.error('Error loading filters:', error);
      setError('Error al cargar los filtros');
    }
  }

  async function loadSections(gradeId: string) {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_letter, grade_level_id')
        .eq('grade_level_id', gradeId)
        .order('section_letter');

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      console.error('Error loading sections:', error);
    }
  }

  async function loadAgingReport() {
    try {
      setLoading(true);
      setError('');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Construir query de cargos con filtros
      let query = supabase
        .from('charges')
        .select(`
          id,
          student_id,
          final_amount,
          due_date,
          students!inner(
            id,
            first_name,
            last_name,
            student_code,
            section:sections!inner(
              section_letter,
              grade_level:grade_levels(name)
            )
          ),
          payments(amount)
        `)
        .eq('students.status', 'active');

      // Aplicar filtros
      if (selectedGrade) {
        query = query.eq('students.section.grade_level_id', selectedGrade);
      }
      if (selectedSection) {
        query = query.eq('students.section_id', selectedSection);
      }
      if (selectedMonth) {
        query = query.eq('period_month', parseInt(selectedMonth));
      }

      const { data, error: chargesError } = await query;

      if (chargesError) throw chargesError;

      // Procesar datos
      const studentMap = new Map<string, AgingStudent>();
      let totalDebtAmount = 0;
      let totalOverdueAmount = 0;

      (data || []).forEach((charge: any) => {
        const student = charge.students;
        const totalPaid = (charge.payments || []).reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        );
        const isPaid = totalPaid >= charge.final_amount;
        const dueDate = new Date(charge.due_date + 'T00:00:00');
        const isOverdue = dueDate < today && !isPaid;
        const pending = charge.final_amount - totalPaid;

        if (pending > 0) {
          totalDebtAmount += pending;
        }

        if (isOverdue && pending > 0) {
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalOverdueAmount += pending;

          const key = student.id;
          if (!studentMap.has(key)) {
            studentMap.set(key, {
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              student_code: student.student_code,
              grade: student.section.grade_level.name,
              section: student.section.section_letter,
              total_overdue: 0,
              avg_days_overdue: 0,
              segment: '',
              charges_count: 0,
            });
          }

          const studentData = studentMap.get(key)!;
          studentData.total_overdue += pending;
          studentData.avg_days_overdue =
            (studentData.avg_days_overdue * studentData.charges_count + daysOverdue) /
            (studentData.charges_count + 1);
          studentData.charges_count += 1;
        }
      });

      // Determinar segmentos
      const agingList: AgingStudent[] = Array.from(studentMap.values()).map((student) => {
        const avgDays = Math.round(student.avg_days_overdue);
        let segment = '';
        if (avgDays <= 30) {
          segment = '0-30';
        } else if (avgDays <= 60) {
          segment = '31-60';
        } else if (avgDays <= 90) {
          segment = '61-90';
        } else {
          segment = '+90';
        }
        return { ...student, segment, avg_days_overdue: avgDays };
      });

      agingList.sort((a, b) => b.total_overdue - a.total_overdue);

      setAgingData(agingList);
      setTotalDebt(totalDebtAmount);
      setTotalOverdue(totalOverdueAmount);
      setDelinquencyRate(totalDebtAmount > 0 ? (totalOverdueAmount / totalDebtAmount) * 100 : 0);
    } catch (error: any) {
      console.error('Error loading aging report:', error);
      setError('Error al cargar el reporte de morosidad');
    } finally {
      setLoading(false);
    }
  }

  async function loadCollectionReport() {
    try {
      setLoading(true);
      setError('');

      // Cargar todos los pagos del año académico
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('year')
        .eq('id', selectedYear)
        .single();

      if (!yearData) return;

      const year = parseInt(yearData.year);

      const { data, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', `${year}-01-01`)
        .lte('payment_date', `${year}-12-31`);

      if (paymentsError) throw paymentsError;

      // Agrupar por mes
      const monthMap = new Map<number, CollectionMonth>();

      const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];

      for (let i = 1; i <= 12; i++) {
        monthMap.set(i, {
          month: i,
          month_name: monthNames[i - 1],
          total_collected: 0,
          transactions_count: 0,
          avg_ticket: 0,
        });
      }

      (data || []).forEach((payment: any) => {
        const date = new Date(payment.payment_date);
        const month = date.getMonth() + 1;
        const monthData = monthMap.get(month)!;
        monthData.total_collected += payment.amount;
        monthData.transactions_count += 1;
      });

      // Calcular ticket promedio
      const collectionList = Array.from(monthMap.values()).map((month) => ({
        ...month,
        avg_ticket:
          month.transactions_count > 0 ? month.total_collected / month.transactions_count : 0,
      }));

      setCollectionData(collectionList);
    } catch (error: any) {
      console.error('Error loading collection report:', error);
      setError('Error al cargar el reporte de recaudación');
    } finally {
      setLoading(false);
    }
  }

  async function loadEffectivenessReport() {
    try {
      setLoading(true);
      setError('');

      // Cargar año académico
      const { data: yearData } = await supabase
        .from('academic_years')
        .select('year')
        .eq('id', selectedYear)
        .single();

      if (!yearData) return;

      const year = parseInt(yearData.year);

      // Cargar cargos emitidos por mes
      const { data: chargesData, error: chargesError } = await supabase
        .from('charges')
        .select('final_amount, period_month, period_year')
        .eq('period_year', year);

      if (chargesError) throw chargesError;

      // Cargar pagos por mes
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', `${year}-01-01`)
        .lte('payment_date', `${year}-12-31`);

      if (paymentsError) throw paymentsError;

      const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];

      const monthMap = new Map<number, EffectivenessMonth>();

      for (let i = 1; i <= 12; i++) {
        monthMap.set(i, {
          month: i,
          month_name: monthNames[i - 1],
          total_issued: 0,
          total_paid: 0,
          effectiveness: 0,
          difference: 0,
        });
      }

      // Sumar cargos emitidos
      (chargesData || []).forEach((charge: any) => {
        if (charge.period_month) {
          const monthData = monthMap.get(charge.period_month)!;
          monthData.total_issued += charge.final_amount;
        }
      });

      // Sumar pagos
      (paymentsData || []).forEach((payment: any) => {
        const date = new Date(payment.payment_date);
        const month = date.getMonth() + 1;
        const monthData = monthMap.get(month)!;
        monthData.total_paid += payment.amount;
      });

      // Calcular efectividad
      const effectivenessList = Array.from(monthMap.values()).map((month) => ({
        ...month,
        effectiveness: month.total_issued > 0 ? (month.total_paid / month.total_issued) * 100 : 0,
        difference: month.total_paid - month.total_issued,
      }));

      setEffectivenessData(effectivenessList);
    } catch (error: any) {
      console.error('Error loading effectiveness report:', error);
      setError('Error al cargar el reporte de efectividad');
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'aging') {
      csvContent = 'Código,Alumno,Grado,Sección,Monto Vencido,Días Promedio,Segmento\n';
      agingData.forEach((student) => {
        csvContent += `"${student.student_code}","${student.student_name}","${student.grade}","${student.section}",${student.total_overdue.toFixed(2)},${student.avg_days_overdue},"${student.segment}"\n`;
      });
      filename = 'reporte_morosidad.csv';
    } else if (activeTab === 'collection') {
      csvContent = 'Mes,Total Recaudado,N° Transacciones,Ticket Promedio\n';
      collectionData.forEach((month) => {
        csvContent += `"${month.month_name}",${month.total_collected.toFixed(2)},${month.transactions_count},${month.avg_ticket.toFixed(2)}\n`;
      });
      filename = 'reporte_recaudacion.csv';
    } else if (activeTab === 'effectiveness') {
      csvContent = 'Mes,Emitido,Pagado,Efectividad (%),Diferencia\n';
      effectivenessData.forEach((month) => {
        csvContent += `"${month.month_name}",${month.total_issued.toFixed(2)},${month.total_paid.toFixed(2)},${month.effectiveness.toFixed(2)},${month.difference.toFixed(2)}\n`;
      });
      filename = 'reporte_efectividad.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function getSegmentBadge(segment: string) {
    switch (segment) {
      case '0-30':
        return <Badge variant="warning">0-30 días</Badge>;
      case '31-60':
        return <Badge style={{ backgroundColor: '#F97316', color: 'white' }}>31-60 días</Badge>;
      case '61-90':
        return <Badge variant="error">61-90 días</Badge>;
      case '+90':
        return (
          <Badge style={{ backgroundColor: '#7F1D1D', color: 'white' }}>+90 días</Badge>
        );
      default:
        return <Badge variant="secondary">{segment}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Reportes Financieros</h1>
          <p className="text-[#334155] mt-1">Análisis de morosidad, recaudación y efectividad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button variant="outline" disabled>
            <FileText className="w-4 h-4 mr-2" />
            Exportar a PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'aging'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Análisis de Morosidad
            </div>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'collection'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Recaudación Mensual
            </div>
          </button>
          <button
            onClick={() => setActiveTab('effectiveness')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'effectiveness'
                ? 'border-[#3B82F6] text-[#3B82F6]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Efectividad de Cobranza
            </div>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Año Académico"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Seleccionar año</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </Select>

            {activeTab === 'aging' && (
              <>
                <Select
                  label="Grado"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="">Todos los grados</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Sección"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedGrade}
                >
                  <option value="">Todas las secciones</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.section_letter}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Mes"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Todos los meses</option>
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* TAB 1: Aging */}
          {activeTab === 'aging' && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card variant="elevated" className="border-t-4 border-[#F59E0B]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        S/ {totalDebt.toFixed(2)}
                      </span>
                      <DollarSign className="w-8 h-8 text-[#F59E0B]" />
                    </div>
                    <p className="text-sm text-[#334155]">Total Adeudado</p>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#EF4444]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        S/ {totalOverdue.toFixed(2)}
                      </span>
                      <TrendingDown className="w-8 h-8 text-[#EF4444]" />
                    </div>
                    <p className="text-sm text-[#334155]">Total Vencido</p>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="border-t-4 border-[#8B5CF6]">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        {delinquencyRate.toFixed(1)}%
                      </span>
                      <AlertCircle className="w-8 h-8 text-[#8B5CF6]" />
                    </div>
                    <p className="text-sm text-[#334155]">% de Morosidad</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    Alumnos con Deuda Vencida ({agingData.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  {agingData.length === 0 ? (
                    <div className="text-center py-12 text-[#94A3B8]">
                      <p>No hay deudas vencidas con los filtros seleccionados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Código
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Alumno
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Grado
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Sección
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Monto Vencido
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Días Promedio
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Segmento
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {agingData.map((student) => (
                            <tr
                              key={student.student_id}
                              className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                            >
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {student.student_code}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                                {student.student_name}
                              </td>
                              <td className="py-3 px-4 text-sm text-center text-[#64748B]">
                                {student.grade}
                              </td>
                              <td className="py-3 px-4 text-sm text-center text-[#64748B]">
                                {student.section}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-semibold text-[#EF4444]">
                                S/ {student.total_overdue.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm text-center text-[#64748B]">
                                {student.avg_days_overdue} días
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getSegmentBadge(student.segment)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 2: Collection */}
          {activeTab === 'collection' && (
            <>
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    Recaudación Mensual - Gráfico
                  </h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={collectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month_name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="total_collected" name="Recaudado" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Detalle Mensual</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Mes
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Recaudado
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            N° Transacciones
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Ticket Promedio
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectionData.map((month) => (
                          <tr
                            key={month.month}
                            className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                              {month.month_name}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-[#10B981]">
                              S/ {month.total_collected.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-[#64748B]">
                              {month.transactions_count}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-[#64748B]">
                              S/ {month.avg_ticket.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#E2E8F0] font-bold">
                          <td className="py-3 px-4 text-sm text-[#0F172A]">Total Anual</td>
                          <td className="py-3 px-4 text-sm text-right text-[#10B981]">
                            S/{' '}
                            {collectionData
                              .reduce((sum, m) => sum + m.total_collected, 0)
                              .toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-center text-[#64748B]">
                            {collectionData.reduce((sum, m) => sum + m.transactions_count, 0)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-[#64748B]">
                            S/{' '}
                            {(
                              collectionData.reduce((sum, m) => sum + m.total_collected, 0) /
                              collectionData.reduce((sum, m) => sum + m.transactions_count, 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 3: Effectiveness */}
          {activeTab === 'effectiveness' && (
            <>
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    Efectividad de Cobranza - Gráfico
                  </h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={effectivenessData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month_name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="total_issued" name="Emitido" fill="#3B82F6" />
                      <Bar dataKey="total_paid" name="Pagado" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    Comparativa Emitido vs Recaudado
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Mes
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Emitido
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Pagado
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Efectividad
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                            Diferencia
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectivenessData.map((month) => (
                          <tr
                            key={month.month}
                            className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-[#0F172A]">
                              {month.month_name}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-[#3B82F6]">
                              S/ {month.total_issued.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-[#10B981]">
                              S/ {month.total_paid.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  month.effectiveness >= 80
                                    ? 'success'
                                    : month.effectiveness >= 60
                                      ? 'warning'
                                      : 'error'
                                }
                              >
                                {month.effectiveness.toFixed(1)}%
                              </Badge>
                            </td>
                            <td
                              className={`py-3 px-4 text-sm text-right font-semibold ${month.difference >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                                }`}
                            >
                              {month.difference >= 0 ? '+' : ''}S/ {month.difference.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#E2E8F0] font-bold">
                          <td className="py-3 px-4 text-sm text-[#0F172A]">Total Anual</td>
                          <td className="py-3 px-4 text-sm text-right text-[#3B82F6]">
                            S/{' '}
                            {effectivenessData
                              .reduce((sum, m) => sum + m.total_issued, 0)
                              .toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-[#10B981]">
                            S/{' '}
                            {effectivenessData
                              .reduce((sum, m) => sum + m.total_paid, 0)
                              .toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="info">
                              {(
                                (effectivenessData.reduce((sum, m) => sum + m.total_paid, 0) /
                                  effectivenessData.reduce((sum, m) => sum + m.total_issued, 0)) *
                                100
                              ).toFixed(1)}
                              %
                            </Badge>
                          </td>
                          <td
                            className={`py-3 px-4 text-sm text-right font-semibold ${effectivenessData.reduce((sum, m) => sum + m.difference, 0) >= 0
                                ? 'text-[#10B981]'
                                : 'text-[#EF4444]'
                              }`}
                          >
                            {effectivenessData.reduce((sum, m) => sum + m.difference, 0) >= 0
                              ? '+'
                              : ''}
                            S/{' '}
                            {effectivenessData
                              .reduce((sum, m) => sum + m.difference, 0)
                              .toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
