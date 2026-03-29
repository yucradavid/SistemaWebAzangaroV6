import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Filter,
  Download,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Justification {
  id: string;
  reason: string;
  attachment_url: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  review_notes: string | null;
  created_at: string;
  student: {
    id: string;
    student_code: string;
    first_name: string;
    last_name: string;
    section: {
      section_letter: string;
      grade_level: {
        name: string;
      };
    };
  };
  guardian: {
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  attendance: {
    id: string;
    date: string;
    status: 'tarde' | 'falta';
    course: {
      name: string;
      code: string;
    };
  };
}

export function AttendanceApprovalsPage() {
  const { profile } = useAuth();
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pendiente');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadJustifications();
  }, [filterStatus]);

  async function loadJustifications() {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('attendance_justifications')
        .select(`
          id,
          reason,
          attachment_url,
          status,
          review_notes,
          created_at,
          student:students(
            id,
            student_code,
            first_name,
            last_name,
            section:sections(
              section_letter,
              grade_level:grade_levels(name)
            )
          ),
          guardian:guardians(
            first_name,
            last_name,
            phone
          ),
          attendance:attendance(
            id,
            date,
            status,
            course:courses(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'todas') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJustifications(data || []);
    } catch (error) {
      console.error('Error loading justifications:', error);
      setError('Error al cargar las justificaciones');
    } finally {
      setLoading(false);
    }
  }

  function openReviewModal(justification: Justification, action: 'approve' | 'reject') {
    setSelectedJustification(justification);
    setReviewNotes('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  async function handleApprove() {
    if (!selectedJustification) return;

    try {
      setProcessing(true);
      setError('');

      const { error: updateError } = await supabase
        .from('attendance_justifications')
        .update({
          status: 'aprobada',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', selectedJustification.id);

      if (updateError) throw updateError;

      // Actualizar el estado de asistencia a "justificado"
      const { error: attendanceError } = await supabase
        .from('attendance')
        .update({
          status: 'justificado',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', selectedJustification.attendance.id);

      if (attendanceError) throw attendanceError;

      setSuccess('Justificación aprobada correctamente');
      setTimeout(() => {
        setModalOpen(false);
        loadJustifications();
      }, 1500);
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error approving justification:', error);
      setError('Error al aprobar la justificación');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selectedJustification) return;

    if (!reviewNotes.trim()) {
      setError('Debes proporcionar un motivo de rechazo');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const { error: updateError } = await supabase
        .from('attendance_justifications')
        .update({
          status: 'rechazada',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', selectedJustification.id);

      if (updateError) throw updateError;

      setSuccess('Justificación rechazada');
      setTimeout(() => {
        setModalOpen(false);
        loadJustifications();
      }, 1500);
    } catch (err) {
      const error = err as { message?: string };
      console.error('Error rejecting justification:', error);
      setError('Error al rechazar la justificación');
    } finally {
      setProcessing(false);
    }
  }

  if (loading && justifications.length === 0) {
    return <Loading fullScreen text="Cargando justificaciones..." />;
  }

  const pendingCount = justifications.filter((j) => j.status === 'pendiente').length;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cermat-blue-dark mb-2">
            Aprobación de Justificaciones
          </h1>
          <p className="text-slate-600">Gestiona las justificaciones de inasistencias</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="error" size="md" className="py-2 px-4">
            {pendingCount} pendientes
          </Badge>
        )}
      </div>

      {error && !modalOpen && (
        <Card variant="elevated" className="border-2 border-[#C81E1E]">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-[#C81E1E]">
              <XCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-[#334155]" />
            <Select
              label=""
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1"
            >
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="todas">Todas</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de justificaciones */}
      {loading ? (
        <Loading text="Cargando..." />
      ) : justifications.length > 0 ? (
        <div className="space-y-4">
          {justifications.map((justification) => (
            <Card key={justification.id} variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${justification.attendance.status === 'falta'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                      }`}
                  >
                    {justification.attendance.status === 'falta' ? (
                      <XCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Calendar className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                          {justification.student.first_name} {justification.student.last_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {justification.student.student_code}
                          </Badge>
                          <Badge variant="outline">
                            {justification.student.section.grade_level.name}{' '}
                            {justification.student.section.section_letter}
                          </Badge>
                          <Badge
                            variant={
                              justification.attendance.status === 'falta' ? 'error' : 'info'
                            }
                          >
                            {justification.attendance.status === 'falta'
                              ? 'FALTA'
                              : 'TARDANZA'}
                          </Badge>
                        </div>
                      </div>
                      <Badge
                        variant={
                          justification.status === 'aprobada'
                            ? 'success'
                            : justification.status === 'rechazada'
                              ? 'error'
                              : 'info'
                        }
                        className="font-bold"
                      >
                        {justification.status === 'pendiente'
                          ? 'PENDIENTE'
                          : justification.status === 'aprobada'
                            ? 'APROBADA'
                            : 'RECHAZADA'}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-[#334155] mb-1">
                          <span className="font-medium">Fecha:</span>{' '}
                          {new Date(justification.attendance.date).toLocaleDateString('es-PE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-[#334155]">
                          <span className="font-medium">Curso:</span>{' '}
                          {justification.attendance.course.code} -{' '}
                          {justification.attendance.course.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#334155] mb-1">
                          <span className="font-medium">Apoderado:</span>{' '}
                          {justification.guardian.first_name} {justification.guardian.last_name}
                        </p>
                        {justification.guardian.phone && (
                          <p className="text-sm text-[#334155]">
                            <span className="font-medium">Teléfono:</span>{' '}
                            {justification.guardian.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-[#F8FAFC] rounded-lg mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#334155] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0F172A] mb-1">
                            Motivo de la justificación:
                          </p>
                          <p className="text-sm text-[#334155]">{justification.reason}</p>
                        </div>
                      </div>
                      {justification.attachment_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Download />}
                          onClick={() => window.open(justification.attachment_url!, '_blank')}
                        >
                          Ver documento adjunto
                        </Button>
                      )}
                    </div>

                    {justification.review_notes && (
                      <div className="p-4 bg-blue-50 rounded-lg mb-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Nota de revisión:
                            </p>
                            <p className="text-sm text-blue-800">{justification.review_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {justification.status === 'pendiente' && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          icon={<CheckCircle />}
                          onClick={() => openReviewModal(justification, 'approve')}
                          fullWidth
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          icon={<XCircle />}
                          onClick={() => openReviewModal(justification, 'reject')}
                          fullWidth
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#F1F5F9] rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-12 h-12 text-[#334155]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-2">
                No hay justificaciones {filterStatus !== 'todas' && filterStatus}
              </h3>
              <p className="text-[#334155]">
                {filterStatus === 'pendiente'
                  ? 'No hay justificaciones pendientes de revisión'
                  : 'No se encontraron justificaciones con este filtro'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de revisión */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Revisar justificación - ${selectedJustification?.student.first_name} ${selectedJustification?.student.last_name}`}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-[#C81E1E] rounded-xl">
              <p className="text-sm text-[#C81E1E]">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {selectedJustification && (
            <>
              <div className="p-4 bg-[#F8FAFC] rounded-xl">
                <p className="text-sm text-[#334155] mb-2">
                  <span className="font-semibold">Motivo del apoderado:</span>
                </p>
                <p className="text-sm text-[#0F172A]">{selectedJustification.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  Notas de revisión (opcional para aprobar, obligatorio para rechazar)
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:border-[#0E3A8A] focus:outline-none"
                  rows={4}
                  placeholder="Agrega comentarios sobre tu decisión..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setModalOpen(false)}
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  icon={<CheckCircle />}
                  onClick={handleApprove}
                  disabled={processing}
                  fullWidth
                >
                  {processing ? <Loading size="sm" /> : 'Aprobar'}
                </Button>
                <Button
                  variant="danger"
                  icon={<XCircle />}
                  onClick={handleReject}
                  disabled={processing}
                  fullWidth
                >
                  {processing ? <Loading size="sm" /> : 'Rechazar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
