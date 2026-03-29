import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { AlertTriangle } from 'lucide-react';

interface DelinquencyData {
  grade: string;
  percentage: number;
  delinquentCount: number;
  totalCount: number;
  amount: number;
}

export function DelinquencyByGradeChart() {
  const [data, setData] = useState<DelinquencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDelinquent, setTotalDelinquent] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadDelinquencyData();
  }, []);

  async function loadDelinquencyData() {
    try {
      setLoading(true);
      
      // Obtener estudiantes agrupados por grado con sus deudas
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          section_id,
          sections!inner (
            grade_level_id,
            grade_levels!inner (
              name,
              order_index
            )
          )
        `)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Obtener todos los cargos pendientes
      const { data: chargesData, error: chargesError } = await supabase
        .from('charges')
        .select('student_id, amount, status')
        .in('status', ['pending', 'overdue']);

      if (chargesError) throw chargesError;

      // Agrupar por grado
      const gradeMap = new Map<string, {
        name: string;
        orderIndex: number;
        totalStudents: number;
        delinquentStudents: Set<string>;
        totalDebt: number;
      }>();

      // Inicializar grados
      studentsData?.forEach((student: any) => {
        const gradeName = student.sections.grade_levels.name;
        const orderIndex = student.sections.grade_levels.order_index;
        
        if (!gradeMap.has(gradeName)) {
          gradeMap.set(gradeName, {
            name: gradeName,
            orderIndex,
            totalStudents: 0,
            delinquentStudents: new Set(),
            totalDebt: 0,
          });
        }
        
        const gradeData = gradeMap.get(gradeName)!;
        gradeData.totalStudents++;
      });

      // Marcar estudiantes con deudas
      chargesData?.forEach((charge: any) => {
        const student = studentsData?.find((s: any) => s.id === charge.student_id);
        if (student) {
          const gradeName = student.sections.grade_levels.name;
          const gradeData = gradeMap.get(gradeName);
          if (gradeData) {
            gradeData.delinquentStudents.add(charge.student_id);
            gradeData.totalDebt += Number(charge.amount);
          }
        }
      });

      // Convertir a array y calcular porcentajes
      const delinquencyData: DelinquencyData[] = Array.from(gradeMap.values())
        .map(grade => ({
          grade: grade.name,
          percentage: grade.totalStudents > 0 
            ? Math.round((grade.delinquentStudents.size / grade.totalStudents) * 100)
            : 0,
          delinquentCount: grade.delinquentStudents.size,
          totalCount: grade.totalStudents,
          amount: grade.totalDebt,
        }))
        .sort((a, b) => {
          const orderA = gradeMap.get(a.grade)?.orderIndex || 0;
          const orderB = gradeMap.get(b.grade)?.orderIndex || 0;
          return orderA - orderB;
        });

      // Calcular totales
      const totalDelinquentStudents = delinquencyData.reduce((sum, g) => sum + g.delinquentCount, 0);
      const totalDebt = delinquencyData.reduce((sum, g) => sum + g.amount, 0);

      setData(delinquencyData);
      setTotalDelinquent(totalDelinquentStudents);
      setTotalAmount(totalDebt);
    } catch (err) {
      console.error('Error loading delinquency data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Colores basados en el porcentaje de morosidad
  const getBarColor = (percentage: number) => {
    if (percentage >= 50) return '#dc2626'; // Rojo - crítico
    if (percentage >= 30) return '#f97316'; // Naranja - alto
    if (percentage >= 15) return '#f59e0b'; // Amarillo - medio
    return '#22c55e'; // Verde - bajo
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Morosidad por Grado</h3>
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-600">Estudiantes morosos</p>
            <p className="text-xl font-bold text-orange-600">{totalDelinquent}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Deuda total</p>
            <p className="text-xl font-bold text-red-600">S/ {totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Leyenda de colores */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">&lt; 15% (Bajo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-gray-600">15-29% (Medio)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-gray-600">30-49% (Alto)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-600"></div>
            <span className="text-gray-600">≥ 50% (Crítico)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="grade"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number, name: string, props: any) => {
              const { delinquentCount, totalCount, amount } = props.payload;
              return [
                <div key="tooltip" className="space-y-1">
                  <div className="font-bold text-gray-900">{value}% de morosidad</div>
                  <div className="text-sm text-gray-600">
                    {delinquentCount} de {totalCount} estudiantes
                  </div>
                  <div className="text-sm text-gray-600">
                    Deuda: S/ {amount.toLocaleString()}
                  </div>
                </div>,
                ''
              ];
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
          />
          <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tabla resumen */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Grado</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Morosos</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Total</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">%</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700">Deuda</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-900">{item.grade}</td>
                <td className="py-2 px-2 text-center text-orange-600 font-medium">
                  {item.delinquentCount}
                </td>
                <td className="py-2 px-2 text-center text-gray-600">{item.totalCount}</td>
                <td className="py-2 px-2 text-center">
                  <span
                    className="inline-block px-2 py-1 rounded text-white font-medium"
                    style={{ backgroundColor: getBarColor(item.percentage) }}
                  >
                    {item.percentage}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right text-gray-900 font-medium">
                  S/ {item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
