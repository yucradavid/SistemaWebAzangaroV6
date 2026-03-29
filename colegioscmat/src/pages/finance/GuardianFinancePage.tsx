import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Clock, CheckCircle, CreditCard, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { GoBackButton } from '../../components/ui/GoBackButton';
import { useAuth } from '../../contexts/AuthContext';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  section: {
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
}

interface Charge {
  id: string;
  description: string;
  amount: number;
  discount: number;
  final_amount: number;
  due_date: string;
  status: string;
  period_month: number | null;
  period_year: number | null;
  concept: {
    name: string;
  } | null;
  payments: Array<{
    amount: number;
  }>;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  receipts: Array<{
    receipt_number: string;
    id: string;
  }>;
  charge: {
    description: string;
  };
}

export function GuardianFinancePage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('unpaid');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadChildFinancialData(selectedChild.id);
    }
  }, [selectedChild, filterStatus]);

  async function loadChildren() {
    try {
      setLoading(true);

      // Verificar si el usuario es admin/director/finance
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      const isStaff = profile && ['admin', 'director', 'finance', 'cashier'].includes(profile.role);

      if (isStaff) {
        // Si es staff, mostrar TODOS los estudiantes activos
        const { data: allStudents, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            student_code,
            section:sections(
              section_letter,
              grade_level:grade_levels(name)
            )
          `)
          .eq('status', 'active')
          .order('first_name');

        if (studentsError) throw studentsError;

        setChildren(allStudents || []);
        if (allStudents && allStudents.length > 0) {
          setSelectedChild(allStudents[0]);
        }
      } else {
        // Si es apoderado, mostrar solo sus hijos
        const { data: guardianList, error: guardianError } = await supabase
          .from('guardians')
          .select('id')
          .eq('user_id', user?.id);

        if (guardianError) throw guardianError;

        if (!guardianList || guardianList.length === 0) {
          setError('No se encontró información de apoderado');
          setLoading(false);
          return;
        }

        const guardian = guardianList[0];

        const { data, error: childrenError } = await supabase
          .from('student_guardians')
          .select(`
            student:students(
              id,
              first_name,
              last_name,
              student_code,
              section:sections(
                section_letter,
                grade_level:grade_levels(name)
              )
            )
          `)
          .eq('guardian_id', guardian.id);

        if (childrenError) throw childrenError;

        const childrenList = (data || []).map((sg: any) => sg.student).filter(Boolean);
        setChildren(childrenList);

        if (childrenList.length > 0) {
          setSelectedChild(childrenList[0]);
        }
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      setError('Error al cargar los hijos');
    } finally {
      setLoading(false);
    }
  }

  async function loadChildFinancialData(studentId: string) {
    try {
      setLoading(true);

      // Cargar cargos
      let chargesQuery = supabase
        .from('charges')
        .select(`
          id,
          description,
          amount,
          discount,
          final_amount,
          due_date,
          status,
          period_month,
          period_year,
          payments(amount)
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      if (filterStatus === 'unpaid') {
        chargesQuery = chargesQuery.in('status', ['pendiente', 'vencido']);
      } else if (filterStatus === 'paid') {
        chargesQuery = chargesQuery.eq('status', 'pagado');
      }

      const { data: chargesData, error: chargesError } = await chargesQuery;

      if (chargesError) throw chargesError;

      // Calcular estados reales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedCharges = (chargesData || []).map((charge: any) => {
        const totalPaid = (charge.payments || []).reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        );
        const isPaid = totalPaid >= charge.final_amount;
        const dueDate = new Date(charge.due_date + 'T00:00:00');
        const isOverdue = dueDate < today;

        let status = 'pendiente';
        if (isPaid) {
          status = 'pagado';
        } else if (isOverdue) {
          status = 'vencido';
        }

        return { ...charge, status };
      });

      setCharges(processedCharges);

      // Cargar historial de pagos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          payment_date,
          receipts(receipt_number, id),
          charge:charges(description)
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error('Error loading financial data:', error);
      setError('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  }

  function toggleChargeSelection(chargeId: string) {
    const newSelection = new Set(selectedCharges);
    if (newSelection.has(chargeId)) {
      newSelection.delete(chargeId);
    } else {
      newSelection.add(chargeId);
    }
    setSelectedCharges(newSelection);
  }

  function calculateSelectedTotal(): number {
    return charges
      .filter((c) => selectedCharges.has(c.id))
      .reduce((sum, c) => sum + c.final_amount, 0);
  }

  function openPaymentModal() {
    if (selectedCharges.size === 0) {
      setError('Selecciona al menos un cargo para pagar');
      return;
    }
    setError('');
    setPaymentModalOpen(true);
  }

  async function processPayment() {
    if (!selectedChild || selectedCharges.size === 0) return;

    try {
      setPaying(true);
      setError('');

      const chargesToPay = charges.filter((c) => selectedCharges.has(c.id));
      const totalAmount = calculateSelectedTotal();

      // Obtener guardian_id
      const { data: guardianList, error: guardianError } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', user?.id);

      if (guardianError) throw guardianError;

      if (!guardianList || guardianList.length === 0) {
        setError('No se encontró información de apoderado');
        setPaying(false);
        return;
      }

      const guardian = guardianList[0];

      // Crear un pago por cada cargo
      const paymentsToInsert = chargesToPay.map((charge) => ({
        charge_id: charge.id,
        student_id: selectedChild.id,
        amount: charge.final_amount,
        payment_method: 'pasarela',
        transaction_ref: `PORTAL-${Date.now()}`,
        notes: 'Pago desde portal de apoderado (simulado)',
        payment_date: new Date().toISOString(),
      }));

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .insert(paymentsToInsert)
        .select();

      if (paymentsError) throw paymentsError;

      // Actualizar estado de cargos a pagado
      const { error: updateError } = await supabase
        .from('charges')
        .update({ status: 'pagado', updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedCharges));

      if (updateError) throw updateError;

      // Generar número de recibo correlativo
      const { data: lastReceipt } = await supabase
        .from('receipts')
        .select('receipt_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastReceipt?.receipt_number) {
        const match = lastReceipt.receipt_number.match(/REC-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const newReceiptNumber = `REC-${nextNumber.toString().padStart(6, '0')}`;

      // Crear recibo por el pago total (uno por todos los cargos)
      const { error: receiptError } = await supabase.from('receipts').insert([
        {
          receipt_number: newReceiptNumber,
          payment_id: paymentsData[0].id, // Vinculado al primer pago
          student_id: selectedChild.id,
          total_amount: totalAmount,
          issued_by: user?.id,
          issued_at: new Date().toISOString(),
        },
      ]);

      if (receiptError) throw receiptError;

      setReceiptNumber(newReceiptNumber);
      setPaymentModalOpen(false);
      setConfirmationModalOpen(true);
      setSelectedCharges(new Set());

      // Recargar datos
      loadChildFinancialData(selectedChild.id);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Error al procesar el pago');
    } finally {
      setPaying(false);
    }
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
      pasarela: 'Pago Online',
    };
    return labels[method] || method;
  }

  const totals = {
    pending: charges.filter((c) => c.status === 'pendiente').reduce((s, c) => s + c.final_amount, 0),
    overdue: charges.filter((c) => c.status === 'vencido').reduce((s, c) => s + c.final_amount, 0),
    lastPayment: payments.length > 0 ? payments[0] : null,
    nextDue: charges
      .filter((c) => c.status === 'pendiente')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0],
  };

  const selectedTotal = calculateSelectedTotal();

  if (loading && !selectedChild) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Estado de Cuenta</h1>
        <p className="text-[#334155] mt-1">Consulta y paga los cargos de tus hijos</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">No se encontraron hijos asociados a su cuenta</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selector de hijo */}
          {children.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <Select
                  label="Seleccionar Hijo"
                  value={selectedChild?.id || ''}
                  onChange={(e) => {
                    const child = children.find((c) => c.id === e.target.value);
                    setSelectedChild(child || null);
                    setSelectedCharges(new Set());
                  }}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name} - {child.section.grade_level.name}{' '}
                      {child.section.section_letter}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>
          )}

          {selectedChild && (
            <>
              {/* Resumen financiero */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#64748B]">Total Pendiente</p>
                        <p className="text-2xl font-bold text-[#F59E0B]">
                          S/ {totals.pending.toFixed(2)}
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
                        <p className="text-sm text-[#64748B]">Total Vencido</p>
                        <p className="text-2xl font-bold text-[#EF4444]">
                          S/ {totals.overdue.toFixed(2)}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm text-[#64748B]">Último Pago</p>
                      {totals.lastPayment ? (
                        <>
                          <p className="text-2xl font-bold text-[#10B981]">
                            S/ {totals.lastPayment.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-[#64748B] mt-1">
                            {new Date(totals.lastPayment.payment_date).toLocaleDateString('es-PE')}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[#94A3B8]">Sin pagos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm text-[#64748B]">Próximo Vencimiento</p>
                      {totals.nextDue ? (
                        <>
                          <p className="text-2xl font-bold text-[#3B82F6]">
                            S/ {totals.nextDue.final_amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-[#64748B] mt-1">
                            {new Date(totals.nextDue.due_date + 'T00:00:00').toLocaleDateString(
                              'es-PE'
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[#94A3B8]">Sin pendientes</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de cargos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#0F172A]">
                      Cargos ({charges.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <Select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setSelectedCharges(new Set());
                        }}
                      >
                        <option value="unpaid">Por Pagar</option>
                        <option value="paid">Pagados</option>
                        <option value="all">Todos</option>
                      </Select>
                      {selectedCharges.size > 0 && (
                        <Button onClick={openPaymentModal}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagar Ahora (S/ {selectedTotal.toFixed(2)})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {charges.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
                      <p className="text-[#64748B]">No hay cargos en esta categoría</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
                            {filterStatus === 'unpaid' && (
                              <th className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    charges.length > 0 &&
                                    charges.every((c) => selectedCharges.has(c.id))
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCharges(new Set(charges.map((c) => c.id)));
                                    } else {
                                      setSelectedCharges(new Set());
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                              </th>
                            )}
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Concepto
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Periodo
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Monto
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
                              {filterStatus === 'unpaid' && (
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedCharges.has(charge.id)}
                                    onChange={() => toggleChargeSelection(charge.id)}
                                    className="w-4 h-4"
                                  />
                                </td>
                              )}
                              <td className="py-3 px-4">
                                <p className="text-sm font-medium text-[#0F172A]">
                                  {charge.description}
                                </p>
                                {charge.discount > 0 && (
                                  <p className="text-xs text-[#F59E0B]">
                                    Descuento: -S/ {charge.discount.toFixed(2)}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-sm text-[#64748B]">
                                {charge.period_month
                                  ? `${charge.period_month}/${charge.period_year}`
                                  : '-'}
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

              {/* Historial de pagos */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Historial de Pagos ({payments.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
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
                              Método
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-[#0F172A]">
                              Comprobante
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {new Date(payment.payment_date).toLocaleDateString('es-PE')}
                              </td>
                              <td className="py-3 px-4 text-sm text-[#64748B]">
                                {payment.charge.description}
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
                                  : '-'}
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

      {/* Modal de confirmación de pago */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Confirmar Pago"
      >
        <div className="space-y-4">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#0F172A] mb-2">Resumen de Pago</p>
                <div className="space-y-1 text-sm">
                  <p className="text-[#64748B]">
                    <span className="font-medium">Número de cargos:</span> {selectedCharges.size}
                  </p>
                  <p className="text-[#0F172A]">
                    <span className="font-medium">Total a pagar:</span>{' '}
                    <span className="text-xl font-bold text-[#3B82F6]">
                      S/ {selectedTotal.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4">
            <p className="text-sm text-[#92400E]">
              <strong>Nota:</strong> Esta es una versión de demostración. En producción, aquí se
              integraría con una pasarela de pago real (MercadoPago, Culqi, NiuBiz, etc.).
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              className="flex-1"
              disabled={paying}
            >
              Cancelar
            </Button>
            <Button onClick={processPayment} className="flex-1" disabled={paying}>
              {paying ? 'Procesando...' : 'Confirmar Pago (Simulado)'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación exitosa */}
      <Modal
        isOpen={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        title="¡Pago Exitoso!"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Pago Registrado Correctamente</h3>
            <p className="text-[#64748B] mb-4">Tu pago ha sido procesado exitosamente</p>

            <div className="bg-[#F8FAFC] rounded-lg p-4 w-full">
              <p className="text-sm text-[#64748B] mb-1">Número de Comprobante</p>
              <p className="text-2xl font-bold text-[#3B82F6]">{receiptNumber}</p>
            </div>

            <div className="mt-4 text-sm text-[#64748B]">
              <p>Monto pagado: S/ {selectedTotal.toFixed(2)}</p>
              <p>Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            </div>
          </div>

          <Button onClick={() => setConfirmationModalOpen(false)} className="w-full">
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
