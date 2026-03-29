import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { TrendingUp } from 'lucide-react';

interface MonthlyData {
  month: string;
  currentYear: number;
  previousYear: number;
}

export function MonthlyCollectionChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYearTotal, setCurrentYearTotal] = useState(0);
  const [previousYearTotal, setPreviousYearTotal] = useState(0);

  useEffect(() => {
    loadMonthlyData();
  }, []);

  async function loadMonthlyData() {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // Obtener pagos del año actual
      const { data: currentYearPayments, error: currentError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', `${currentYear}-01-01`)
        .lte('payment_date', `${currentYear}-12-31`)
        .eq('status', 'paid');

      if (currentError) throw currentError;

      // Obtener pagos del año anterior
      const { data: previousYearPayments, error: previousError } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', `${previousYear}-01-01`)
        .lte('payment_date', `${previousYear}-12-31`)
        .eq('status', 'paid');

      if (previousError) throw previousError;

      // Procesar datos por mes
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];

      const monthlyData: MonthlyData[] = months.map((month, index) => {
        const monthNumber = index + 1;

        // Suma del año actual
        const currentMonthTotal = currentYearPayments
          ?.filter(p => new Date(p.payment_date).getMonth() + 1 === monthNumber)
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Suma del año anterior
        const previousMonthTotal = previousYearPayments
          ?.filter(p => new Date(p.payment_date).getMonth() + 1 === monthNumber)
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        return {
          month,
          currentYear: Math.round(currentMonthTotal),
          previousYear: Math.round(previousMonthTotal),
        };
      });

      // Calcular totales anuales
      const currentTotal = monthlyData.reduce((sum, m) => sum + m.currentYear, 0);
      const previousTotal = monthlyData.reduce((sum, m) => sum + m.previousYear, 0);

      setData(monthlyData);
      setCurrentYearTotal(currentTotal);
      setPreviousYearTotal(previousTotal);
    } catch (err) {
      console.error('Error loading monthly collection data:', err);
    } finally {
      setLoading(false);
    }
  }

  const growthPercentage = previousYearTotal > 0
    ? ((currentYearTotal - previousYearTotal) / previousYearTotal * 100).toFixed(1)
    : 0;

  const isPositiveGrowth = Number(growthPercentage) >= 0;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Recaudación Mensual</h3>
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">Total {new Date().getFullYear()}</p>
            <p className="text-xl font-bold text-blue-600">
              S/ {currentYearTotal.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total {new Date().getFullYear() - 1}</p>
            <p className="text-xl font-bold text-gray-500">
              S/ {previousYearTotal.toLocaleString()}
            </p>
          </div>
          <div className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
            isPositiveGrowth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPositiveGrowth ? '+' : ''}{growthPercentage}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => [`S/ ${value.toLocaleString()}`, '']}
            labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              if (value === 'currentYear') return `${new Date().getFullYear()}`;
              if (value === 'previousYear') return `${new Date().getFullYear() - 1}`;
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="currentYear"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
            name="currentYear"
          />
          <Line
            type="monotone"
            dataKey="previousYear"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#9ca3af', r: 3 }}
            name="previousYear"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
