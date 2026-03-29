import { useState, useEffect } from 'react';
import { Search, User, DollarSign, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';
import { useAuth } from '../../../contexts/AuthContext';

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
  description: string;
  amount: number;
  discount: number;
  final_amount: number;
  due_date: string;
  status: string;
  period_month: number | null;
  period_year: number | null;
  fee_concept: {
    name: string;
  } | null;
  payments: Array<{
    amount: number;
  }>;
}

export function CashRegisterPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadStudentCharges(selectedStudent.id);
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
        .eq('is_active', true)
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

  async function loadStudentCharges(studentId: string) {
    try {
      setLoading(true);
      setError('');

      const { data, error: chargesError } = await supabase
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
          fee_concept:fee_concepts(name),
          payments(amount)
        `)
        .eq('student_id', studentId)
        .in('status', ['pendiente', 'vencido'])
        .order('due_date');

      if (chargesError) throw chargesError;

      // Calcular estados reales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedCharges = (data || []).map((charge: any) => {
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

      setCharges(processedCharges.filter((c) => c.status !== 'pagado'));
    } catch (error: any) {
      console.error('Error loading charges:', error);
      setError('Error al cargar los cargos del alumno');
    } finally {
      setLoading(false);
    }
  }

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchTerm('');
    setSelectedCharges(new Set());
    setAmountReceived('');
    setNotes('');
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

  function openConfirmModal() {
    if (selectedCharges.size === 0) {
      setError('Selecciona al menos un cargo para cobrar');
      return;
    }

    const totalAmount = calculateSelectedTotal();
    const received = parseFloat(amountReceived);

    if (paymentMethod === 'efectivo' && amountReceived) {
      if (isNaN(received) || received < totalAmount) {
        setError('El monto recibido debe ser mayor o igual al total');
        return;
      }
    }

    setError('');
    setConfirmModalOpen(true);
  }

  async function processPayment() {
    if (!selectedStudent || selectedCharges.size === 0) return;

    try {
      setProcessing(true);
      setError('');

      const chargesToPay = charges.filter((c) => selectedCharges.has(c.id));
      const totalAmount = calculateSelectedTotal();

      // Crear un pago por cada cargo
      const paymentsToInsert = chargesToPay.map((charge) => ({
        charge_id: charge.id,
        student_id: selectedStudent.id,
        amount: charge.final_amount,
        payment_method: paymentMethod,
        notes: notes || null,
        received_by: user?.id,
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

      // Crear recibo
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert([
          {
            receipt_number: newReceiptNumber,
            payment_id: paymentsData[0].id,
            student_id: selectedStudent.id,
            total_amount: totalAmount,
            issued_by: user?.id,
            issued_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Preparar datos del recibo para mostrar
      setReceiptData({
        receipt_number: newReceiptNumber,
        student: selectedStudent,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        amount_received: parseFloat(amountReceived) || totalAmount,
        change: parseFloat(amountReceived) - totalAmount || 0,
        charges: chargesToPay,
        date: new Date().toISOString(),
      });

      setConfirmModalOpen(false);
      setReceiptModalOpen(true);

      // Limpiar selección
      setSelectedCharges(new Set());
      setAmountReceived('');
      setNotes('');

      // Recargar cargos
      loadStudentCharges(selectedStudent.id);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
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
    };
    return labels[method] || method;
  }

  const selectedTotal = calculateSelectedTotal();
  const receivedAmount = parseFloat(amountReceived) || 0;
  const changeAmount = receivedAmount - selectedTotal;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Caja - Registro de Pagos</h1>
        <p className="text-[#334155] mt-1">Registra pagos de estudiantes en efectivo o digital</p>
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

      {/* Información del alumno y cargos */}
      {selectedStudent && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(null);
                    setCharges([]);
                    setSelectedCharges(new Set());
                  }}
                >
                  Cambiar Alumno
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Loading />
          ) : (
            <>
              {/* Cargos pendientes */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Cargos Pendientes ({charges.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  {charges.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
                      <p className="text-[#64748B]">No hay cargos pendientes</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E2E8F0]">
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
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCharges.has(charge.id)}
                                  onChange={() => toggleChargeSelection(charge.id)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm font-medium text-[#0F172A]">
                                  {charge.fee_concept?.name || charge.description}
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

              {/* Sección de pago */}
              {selectedCharges.size > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#64748B]" />
                      <h2 className="text-lg font-semibold text-[#0F172A]">Registrar Pago</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-[#F8FAFC] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#64748B]">Cargos seleccionados:</span>
                          <span className="font-semibold text-[#0F172A]">{selectedCharges.size}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-[#0F172A]">Total a pagar:</span>
                          <span className="text-2xl font-bold text-[#3B82F6]">
                            S/ {selectedTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Medio de Pago"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="yape">Yape</option>
                          <option value="plin">Plin</option>
                          <option value="transferencia">Transferencia</option>
                        </Select>

                        {paymentMethod === 'efectivo' && (
                          <Input
                            label="Monto Recibido"
                            type="number"
                            step="0.01"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            placeholder="0.00"
                          />
                        )}
                      </div>

                      {paymentMethod === 'efectivo' && amountReceived && receivedAmount >= selectedTotal && (
                        <div className="bg-[#DBEAFE] p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#1E40AF]">Vuelto:</span>
                            <span className="text-xl font-bold text-[#1E40AF]">
                              S/ {changeAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-1">
                          Observaciones (opcional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notas adicionales sobre el pago..."
                        />
                      </div>

                      <Button onClick={openConfirmModal} className="w-full" size="lg">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Registrar Pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmar Registro de Pago"
      >
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
            <p className="text-sm text-[#64748B]">
              <span className="font-medium">Alumno:</span> {selectedStudent?.first_name}{' '}
              {selectedStudent?.last_name}
            </p>
            <p className="text-sm text-[#64748B]">
              <span className="font-medium">Cargos:</span> {selectedCharges.size}
            </p>
            <p className="text-sm text-[#64748B]">
              <span className="font-medium">Método:</span> {getPaymentMethodLabel(paymentMethod)}
            </p>
            <div className="pt-2 border-t border-[#E2E8F0]">
              <p className="text-lg font-semibold text-[#0F172A]">
                Total: <span className="text-[#3B82F6]">S/ {selectedTotal.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-[#64748B]">
            ¿Confirmas que deseas registrar este pago? Se generará un comprobante automáticamente.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button onClick={processPayment} className="flex-1" disabled={processing}>
              {processing ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de comprobante */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Pago Registrado"
      >
        {receiptData && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">¡Pago Registrado!</h3>
            </div>

            <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Comprobante:</span>
                <span className="font-bold text-[#3B82F6]">{receiptData.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Alumno:</span>
                <span className="font-medium text-[#0F172A]">
                  {receiptData.student.first_name} {receiptData.student.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Método:</span>
                <span className="font-medium text-[#0F172A]">
                  {getPaymentMethodLabel(receiptData.payment_method)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">Total:</span>
                <span className="text-xl font-bold text-[#10B981]">
                  S/ {receiptData.total_amount.toFixed(2)}
                </span>
              </div>
              {receiptData.payment_method === 'efectivo' && receiptData.change > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Vuelto:</span>
                  <span className="font-semibold text-[#3B82F6]">
                    S/ {receiptData.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-[#94A3B8]">
              {new Date(receiptData.date).toLocaleString('es-PE')}
            </div>

            <Button onClick={() => setReceiptModalOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
