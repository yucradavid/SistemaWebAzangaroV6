import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Lock, Unlock, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Loading } from '../../../components/ui/Loading';
import { Badge } from '../../../components/ui/Badge';
import { GoBackButton } from '../../../components/ui/GoBackButton';
import { useAuth } from '../../../contexts/AuthContext';

interface PaymentSummary {
  payment_method: string;
  count: number;
  total: number;
}

interface CashClosure {
  id: string;
  closure_date: string;
  opening_time: string;
  closing_time: string | null;
  total_cash: number;
  total_cards: number;
  total_transfers: number;
  total_yape: number;
  total_plin: number;
  total_amount: number;
  payments_count: number;
  notes: string | null;
  cashier: {
    full_name: string;
  };
}

export function CashClosuresPage() {
  const { user } = useAuth();
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [currentClosure, setCurrentClosure] = useState<CashClosure | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<CashClosure | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Cargar cierres de caja (todos para admin/finance, solo propios para cajero)
      const closuresQuery = supabase
        .from('cash_closures')
        .select(`
          id,
          closure_date,
          opening_time,
          closing_time,
          total_cash,
          total_cards,
          total_transfers,
          total_yape,
          total_plin,
          total_amount,
          payments_count,
          notes,
          cashier:profiles!cashier_id(
            full_name
          )
        `)
        .order('closure_date', { ascending: false })
        .order('opening_time', { ascending: false })
        .limit(50);

      // Solo cajeros ven sus propios cierres
      const { data: profileList } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id);

      const profile = profileList && profileList.length > 0 ? profileList[0] : null;

      if (profile?.role === 'cajero') {
        closuresQuery.eq('cashier_id', user.id);
      }

      const { data: closuresData, error: closuresError } = await closuresQuery;

      if (closuresError) throw closuresError;
      setClosures(closuresData || []);

      // Verificar si hay cierre abierto para el usuario actual
      const { data: openClosure, error: openError } = await supabase
        .from('cash_closures')
        .select('*')
        .eq('cashier_id', user.id)
        .is('closing_time', null)
        .order('opening_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openError) throw openError;
      setCurrentClosure(openClosure);

      // Si hay cierre abierto, cargar pagos pendientes de asignar
      if (openClosure) {
        await loadPendingPayments(openClosure.opening_time);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingPayments(openingTime: string) {
    if (!user) return;

    try {
      // Cargar resumen de pagos desde la apertura
      const { data, error } = await supabase.rpc('get_payment_summary_by_method', {
        p_cashier_id: user.id,
        p_from_date: openingTime,
      });

      if (error) {
        // Si el RPC no existe, hacer consulta manual
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('payment_method, amount')
          .eq('received_by', user.id)
          .gte('payment_date', openingTime);

        if (paymentsError) throw paymentsError;

        // Agrupar por método
        const summary = (paymentsData || []).reduce((acc: any[], payment: any) => {
          const existing = acc.find((s) => s.payment_method === payment.payment_method);
          if (existing) {
            existing.count++;
            existing.total += payment.amount;
          } else {
            acc.push({
              payment_method: payment.payment_method,
              count: 1,
              total: payment.amount,
            });
          }
          return acc;
        }, []);

        setPendingPayments(summary);
      } else {
        setPendingPayments(data || []);
      }
    } catch (error: any) {
      console.error('Error loading pending payments:', error);
    }
  }

  async function openCashRegister() {
    if (!user) return;

    try {
      setProcessing(true);
      setError('');

      const now = new Date().toISOString();

      const { data, error: insertError } = await supabase
        .from('cash_closures')
        .insert([
          {
            cashier_id: user.id,
            closure_date: now.split('T')[0],
            opening_time: now,
            cash_received: 0,
            expected_balance: 0,
            actual_balance: 0,
            difference: 0,
            total_cash: 0,
            total_cards: 0,
            total_transfers: 0,
            total_yape: 0,
            total_plin: 0,
            total_amount: 0,
            payments_count: 0,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentClosure(data);
      setOpenModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error opening cash register:', error);
      setError(error.message || 'Error al abrir la caja');
    } finally {
      setProcessing(false);
    }
  }

  async function closeCashRegister() {
    if (!currentClosure || !user) return;

    try {
      setProcessing(true);
      setError('');

      // Calcular totales por método
      const totalCash =
        pendingPayments.find((p) => p.payment_method === 'efectivo')?.total || 0;
      const totalCards =
        pendingPayments.find((p) => p.payment_method === 'tarjeta')?.total || 0;
      const totalTransfers =
        pendingPayments.find((p) => p.payment_method === 'transferencia')?.total || 0;
      const totalYape = pendingPayments.find((p) => p.payment_method === 'yape')?.total || 0;
      const totalPlin = pendingPayments.find((p) => p.payment_method === 'plin')?.total || 0;
      const totalAmount = pendingPayments.reduce((sum, p) => sum + p.total, 0);
      const paymentsCount = pendingPayments.reduce((sum, p) => sum + p.count, 0);

      const { error: updateError } = await supabase
        .from('cash_closures')
        .update({
          closing_time: new Date().toISOString(),
          total_cash: totalCash,
          total_cards: totalCards,
          total_transfers: totalTransfers,
          total_yape: totalYape,
          total_plin: totalPlin,
          total_amount: totalAmount,
          payments_count: paymentsCount,
          notes: notes || null,
        })
        .eq('id', currentClosure.id);

      if (updateError) throw updateError;

      setCurrentClosure(null);
      setPendingPayments([]);
      setNotes('');
      setCloseModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error closing cash register:', error);
      setError(error.message || 'Error al cerrar la caja');
    } finally {
      setProcessing(false);
    }
  }

  function viewClosureDetails(closure: CashClosure) {
    setSelectedClosure(closure);
    setDetailsModalOpen(true);
  }

  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta',
      yape: 'Yape',
      plin: 'Plin',
      pasarela: 'Pasarela',
    };
    return labels[method] || method;
  }

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.total, 0);
  const totalCount = pendingPayments.reduce((sum, p) => sum + p.count, 0);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Cierres de Caja</h1>
          <p className="text-[#334155] mt-1">Apertura y cierre de caja diaria</p>
        </div>

        {!currentClosure ? (
          <Button onClick={() => setOpenModalOpen(true)} size="lg">
            <Unlock className="w-5 h-5 mr-2" />
            Abrir Caja
          </Button>
        ) : (
          <Button onClick={() => setCloseModalOpen(true)} variant="outline" size="lg">
            <Lock className="w-5 h-5 mr-2" />
            Cerrar Caja
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado actual de la caja */}
      {currentClosure && (
        <Card className="border-[#3B82F6] border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="text-lg font-semibold text-[#0F172A]">Caja Abierta</h2>
              </div>
              <Badge variant="info">En Operación</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Fecha de Apertura</p>
                <p className="font-semibold text-[#0F172A]">
                  {new Date(currentClosure.opening_time).toLocaleDateString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#64748B] mb-1">Hora de Apertura</p>
                <p className="font-semibold text-[#0F172A]">
                  {new Date(currentClosure.opening_time).toLocaleTimeString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#64748B] mb-1">Cajero</p>
                <p className="font-semibold text-[#0F172A]">
                  {currentClosure.cashier?.full_name}
                </p>
              </div>
            </div>

            {pendingPayments.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-2">
                  Resumen de Pagos Registrados
                </h3>
                <div className="bg-[#F8FAFC] rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {pendingPayments.map((summary) => (
                      <div key={summary.payment_method} className="text-center">
                        <p className="text-xs text-[#64748B] mb-1">
                          {getPaymentMethodLabel(summary.payment_method)}
                        </p>
                        <p className="font-semibold text-[#0F172A]">
                          S/ {summary.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-[#94A3B8]">({summary.count} pagos)</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#64748B]">Total Recaudado</p>
                      <p className="text-xs text-[#94A3B8]">{totalCount} pagos registrados</p>
                    </div>
                    <p className="text-2xl font-bold text-[#3B82F6]">
                      S/ {totalPending.toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-[#94A3B8]">
                <p>No hay pagos registrados aún</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de cierres */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Historial de Cierres</h2>
          </div>
        </CardHeader>
        <CardContent>
          {closures.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p>No hay cierres registrados</p>
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
                      Cajero
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Apertura
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Cierre
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Pagos
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#0F172A]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {closures.map((closure) => (
                    <tr key={closure.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 text-sm text-[#0F172A]">
                        {new Date(closure.closure_date + 'T00:00:00').toLocaleDateString('es-PE')}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#0F172A]">
                        {closure.cashier.full_name}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-[#64748B]">
                        {new Date(closure.opening_time).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-[#64748B]">
                        {closure.closing_time
                          ? new Date(closure.closing_time).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-[#0F172A]">
                        {closure.payments_count}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#0F172A]">
                        S/ {closure.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {closure.closing_time ? (
                          <Badge variant="success">Cerrado</Badge>
                        ) : (
                          <Badge variant="info">Abierto</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewClosureDetails(closure)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Abrir Caja */}
      <Modal
        isOpen={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        title="Abrir Caja"
      >
        <div className="space-y-4">
          <div className="bg-[#DBEAFE] border border-[#3B82F6] rounded-lg p-4 text-sm text-[#1E40AF]">
            <p>
              Se registrará la apertura de caja con la fecha y hora actual. A partir de este
              momento, todos los pagos que registres quedarán asociados a este cierre de caja.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenModalOpen(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button onClick={openCashRegister} className="flex-1" disabled={processing}>
              {processing ? 'Abriendo...' : 'Abrir Caja'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Cerrar Caja */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Cerrar Caja"
      >
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Resumen del Cierre</h3>

            <div className="space-y-2 mb-4">
              {pendingPayments.map((summary) => (
                <div
                  key={summary.payment_method}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#64748B]">
                    {getPaymentMethodLabel(summary.payment_method)} ({summary.count})
                  </span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {summary.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-[#0F172A]">Total General</span>
                <p className="text-xs text-[#94A3B8]">{totalCount} pagos</p>
              </div>
              <span className="text-xl font-bold text-[#3B82F6]">
                S/ {totalPending.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre el cierre de caja..."
            />
          </div>

          <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3 text-sm text-[#92400E]">
            <p>
              Al cerrar la caja, se registrarán todos los totales y no podrás modificarlos. Verifica
              que los montos sean correctos antes de confirmar.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCloseModalOpen(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button onClick={closeCashRegister} className="flex-1" disabled={processing}>
              {processing ? 'Cerrando...' : 'Cerrar Caja'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalles del Cierre */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Detalle del Cierre de Caja"
      >
        {selectedClosure && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#64748B] mb-1">Fecha</p>
                <p className="font-semibold text-[#0F172A]">
                  {new Date(selectedClosure.closure_date + 'T00:00:00').toLocaleDateString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-[#64748B] mb-1">Cajero</p>
                <p className="font-semibold text-[#0F172A]">
                  {selectedClosure.cashier.full_name}
                </p>
              </div>
              <div>
                <p className="text-[#64748B] mb-1">Apertura</p>
                <p className="font-semibold text-[#0F172A]">
                  {new Date(selectedClosure.opening_time).toLocaleTimeString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-[#64748B] mb-1">Cierre</p>
                <p className="font-semibold text-[#0F172A]">
                  {selectedClosure.closing_time
                    ? new Date(selectedClosure.closing_time).toLocaleTimeString('es-PE')
                    : 'Abierto'}
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Desglose por Método</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Efectivo</span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {selectedClosure.total_cash.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Tarjeta</span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {selectedClosure.total_cards.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Transferencia</span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {selectedClosure.total_transfers.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Yape</span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {selectedClosure.total_yape.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Plin</span>
                  <span className="font-semibold text-[#0F172A]">
                    S/ {selectedClosure.total_plin.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] flex justify-between">
                  <div>
                    <span className="font-semibold text-[#0F172A]">Total</span>
                    <p className="text-xs text-[#94A3B8]">{selectedClosure.payments_count} pagos</p>
                  </div>
                  <span className="text-xl font-bold text-[#10B981]">
                    S/ {selectedClosure.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {selectedClosure.notes && (
              <div>
                <p className="text-sm font-medium text-[#0F172A] mb-1">Observaciones</p>
                <p className="text-sm text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg">
                  {selectedClosure.notes}
                </p>
              </div>
            )}

            <Button onClick={() => setDetailsModalOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
