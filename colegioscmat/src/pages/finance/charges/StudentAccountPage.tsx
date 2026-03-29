import { useState, useEffect } from 'react';
import { Search, User, DollarSign, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  code: string;
  section: {
    name: string;
    grade_level: {
      name: string;
    };
  };
}

interface Charge {
  id: string;
  type: string;
  description: string;
  amount: number;
  discount: number;
  final_amount: number;
  due_date: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  period_month: number | null;
  period_year: number | null;
  created_at: string;
  fee_concept: {
    name: string;
    type: string;
  } | null;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_ref: string | null;
  notes: string | null;
  payment_date: string;
  receipts: Array<{
    receipt_number: string;
  }>;
}

interface AgingData {
  current: number; // 0-30 días
  days30: number; // 31-60 días
  days60: number; // 61-90 días
  days90: number; // 90+ días
}

export function StudentAccountPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadStudentAccount(selectedStudent.id);
    }
  }, [selectedStudent]);

  async function searchStudents() {
    if (!searchTerm.trim()) {
      setError('Ingresa un nombre, código o DNI para buscar');
      return;
    }

    try {
      setSearching(true);
      setError('');

      const { data, error: searchError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          code,
          section:sections(
            name,
            grade_level:grade_levels(name)
          )
        `)
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`
        )
        .limit(20);

      if (searchError) throw searchError;

      if (!data || data.length === 0) {
        setError('No se encontraron estudiantes');
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error: any) {
      console.error('Error searching students:', error);
      setError('Error al buscar estudiantes');
    } finally {
      setSearching(false);
    }
  }

  async function loadStudentAccount(studentId: string) {
    try {
      setLoading(true);
      setError('');

      const { data, error: chargesError } = await supabase
        .from('charges')
        .select(`
          id,
          type,
          description,
          amount,
          discount,
          final_amount,
          due_date,
          status,
          period_month,
          period_year,
          created_at,
          fee_concept:fee_concepts(name, type),
          payments(
            id,
            amount,
            payment_method,
            transaction_ref,
            notes,
            payment_date,
            receipts(receipt_number)
          )
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      if (chargesError) throw chargesError;

      // Calcular estado real de cada cargo
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedCharges = (data || []).map((charge: any) => {
        const totalPaid = (charge.payments || []).reduce(
          (sum: number, p: Payment) => sum + p.amount,
          0
        );
        const isPaid = totalPaid >= charge.final_amount;
        const dueDate = new Date(charge.due_date + 'T00:00:00');
        const isOverdue = dueDate < today;

        let status: 'pendiente' | 'pagado' | 'vencido' = 'pendiente';
        if (isPaid) {
          status = 'pagado';
        } else if (isOverdue) {
          status = 'vencido';
        }

        return {
          ...charge,
          status,
        };
      });

      setCharges(processedCharges);
    } catch (error: any) {
      console.error('Error loading account:', error);
      setError('Error al cargar la cuenta del alumno');
    } finally {
      setLoading(false);
    }
  }

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchTerm('');
  }

  function calculateTotals() {
    const totalOwed = charges
      .filter((c) => c.status !== 'pagado')
      .reduce((sum, c) => sum + c.final_amount, 0);

    const totalOverdue = charges
      .filter((c) => c.status === 'vencido')
      .reduce((sum, c) => sum + c.final_amount, 0);

    const totalPaid = charges
      .filter((c) => c.status === 'pagado')
      .reduce((sum, c) => sum + c.final_amount, 0);

    return { totalOwed, totalOverdue, totalPaid };
  }

  function calculateAging(): AgingData {
    const today = new Date();
    const aging: AgingData = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
    };

    charges
      .filter((c) => c.status === 'vencido')
      .forEach((charge) => {
        const dueDate = new Date(charge.due_date + 'T00:00:00');
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          aging.current += charge.final_amount;
        } else if (diffDays <= 60) {
          aging.days30 += charge.final_amount;
        } else if (diffDays <= 90) {
          aging.days60 += charge.final_amount;
        } else {
          aging.days90 += charge.final_amount;
        }
      });

    return aging;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pagado':
        return <Badge variant="success">Pagado</Badge>;
      case 'vencido':
        return <Badge variant="error">Vencido</Badge>;
      case 'pendiente':
        return <Badge variant="warning">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta',
      yape: 'Yape',
      plin: 'Plin',
      pasarela: 'Pasarela Web',
    };
    return labels[method] || method;
  }

  const totals = selectedStudent ? calculateTotals() : null;
  const aging = selectedStudent ? calculateAging() : null;
  const allPayments = selectedStudent
    ? charges.flatMap((c) => c.payments.map((p) => ({ ...p, charge_description: c.description })))
    : [];

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Cuenta del Alumno</h1>
        <p className="text-[#334155] mt-1">Consulta el estado de cuenta de cualquier estudiante</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Búsqueda de alumno */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Buscar Alumno</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre, código o DNI del alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
              className="flex-1"
            />
            <Button onClick={searchStudents} disabled={searching}>
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border border-[#E2E8F0] rounded-lg">
              {searchResults.map((student) => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-b-0"
                >
                  <p className="font-medium text-[#0F172A]">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Código: {student.code} | {student.section.grade_level.name} -{' '}
                    {student.section.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del alumno seleccionado */}
      {selectedStudent && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#DBEAFE] rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <p className="text-[#64748B]">
                    {selectedStudent.section.grade_level.name} - {selectedStudent.section.name} |
                    Código: {selectedStudent.code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Loading />
          ) : (
            <>
              {/* Resumen financiero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#64748B]">Total Adeudado</p>
                        <p className="text-2xl font-bold text-[#EF4444]">
                          S/ {totals?.totalOwed.toFixed(2)}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#64748B]">Total Vencido</p>
                        <p className="text-2xl font-bold text-[#F59E0B]">
                          S/ {totals?.totalOverdue.toFixed(2)}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-[#F59E0B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#64748B]">Total Pagado</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                          S/ {totals?.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-[#10B981]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Aging (tramos de morosidad) */}
              {aging && (aging.current > 0 || aging.days30 > 0 || aging.days60 > 0 || aging.days90 > 0) && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-[#0F172A]">Análisis de Morosidad</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-[#FEF3C7] p-4 rounded-lg">
                        <p className="text-sm text-[#92400E]">0-30 días</p>
                        <p className="text-xl font-bold text-[#92400E]">
                          S/ {aging.current.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[#FED7AA] p-4 rounded-lg">
                        <p className="text-sm text-[#7C2D12]">31-60 días</p>
                        <p className="text-xl font-bold text-[#7C2D12]">
                          S/ {aging.days30.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[#FECACA] p-4 rounded-lg">
                        <p className="text-sm text-[#7F1D1D]">61-90 días</p>
                        <p className="text-xl font-bold text-[#7F1D1D]">
                          S/ {aging.days60.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[#FCA5A5] p-4 rounded-lg">
                        <p className="text-sm text-[#7F1D1D]">+90 días</p>
                        <p className="text-xl font-bold text-[#7F1D1D]">
                          S/ {aging.days90.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabla de cargos */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Cargos ({charges.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  {charges.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
                      <p className="text-[#64748B]">No hay cargos registrados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Fecha Emisión
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Concepto
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Periodo
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Monto Original
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Descuento
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Monto Final
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Vencimiento
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {charges.map((charge) => (
                            <tr
                              key={charge.id}
                              className={`border-b border-[#E2E8F0] ${charge.status === 'vencido' ? 'bg-red-50' : 'hover:bg-[#F8FAFC]'
                                }`}
                            >
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {new Date(charge.created_at).toLocaleDateString('es-PE')}
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm font-medium text-[#0F172A]">
                                  {charge.fee_concept?.name || charge.description}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#64748B]">
                                {charge.period_month
                                  ? `${charge.period_month}/${charge.period_year}`
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-[#64748B]">
                                S/ {charge.amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-[#F59E0B]">
                                {charge.discount > 0 ? `-S/ ${charge.discount.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-[#0F172A]">
                                S/ {charge.final_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#64748B]">
                                {new Date(charge.due_date + 'T00:00:00').toLocaleDateString(
                                  'es-PE'
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getStatusBadge(charge.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabla de pagos */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Pagos Realizados ({allPayments.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  {allPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
                      <p className="text-[#64748B]">No hay pagos registrados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Fecha
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Concepto
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Monto
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Medio
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Comprobante
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Observaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {allPayments
                            .sort(
                              (a, b) =>
                                new Date(b.payment_date).getTime() -
                                new Date(a.payment_date).getTime()
                            )
                            .map((payment: any) => (
                              <tr key={payment.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                                <td className="py-3 px-4 text-sm text-[#64748B]">
                                  {new Date(payment.payment_date).toLocaleDateString('es-PE')}
                                </td>
                                <td className="py-3 px-4 text-sm text-[#64748B]">
                                  {payment.charge_description}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-[#10B981]">
                                  S/ {payment.amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge variant="info">
                                    {getPaymentMethodLabel(payment.payment_method)}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-[#64748B]">
                                  {payment.receipts && payment.receipts.length > 0
                                    ? payment.receipts[0].receipt_number
                                    : payment.transaction_ref || '-'}
                                </td>
                                <td className="py-3 px-4 text-sm text-[#64748B]">
                                  {payment.notes || '-'}
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
        </>
      )}
    </div>
  );
}
