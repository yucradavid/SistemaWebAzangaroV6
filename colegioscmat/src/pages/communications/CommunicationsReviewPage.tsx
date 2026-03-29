import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Filter, Archive, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { GoBackButton } from '../../components/ui/GoBackButton';

type AnnouncementStatus = 'borrador' | 'pendiente_aprobacion' | 'publicado' | 'archivado';
type AnnouncementAudience = 'todos' | 'docentes' | 'estudiantes' | 'apoderados' | 'seccion_especifica';

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  section_id: string | null;
  status: AnnouncementStatus;
  priority: string;
  attachment_url: string | null;
  created_by: string;
  approved_by: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  section?: {
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
  creator: {
    full_name: string;
  };
  approver?: {
    full_name: string;
  };
}

export function CommunicationsReviewPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pendiente_aprobacion');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          section:sections(
            section_letter,
            grade_level:grade_levels(name)
          ),
          creator:profiles!announcements_created_by_fkey(full_name),
          approver:profiles!announcements_approved_by_fkey(full_name)
        `)
        .in('status', ['pendiente_aprobacion', 'publicado', 'archivado'])
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los comunicados');
    } finally {
      setLoading(false);
    }
  }

  function openDetailModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setDetailModalOpen(true);
  }

  function openApproveModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setApproveModalOpen(true);
  }

  function openRejectModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setRejectReason('');
    setRejectModalOpen(true);
  }

  function openArchiveModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setArchiveModalOpen(true);
  }

  async function handleApprove() {
    if (!selectedAnnouncement || !user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'publicado',
          approved_by: user.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAnnouncement.id);

      if (error) throw error;

      setApproveModalOpen(false);
      setSelectedAnnouncement(null);
      loadData();
    } catch (error: any) {
      console.error('Error approving announcement:', error);
      alert('Error al aprobar el comunicado');
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!selectedAnnouncement || !rejectReason.trim()) {
      setError('Debe proporcionar un motivo de rechazo');
      return;
    }

    try {
      setSaving(true);

      // Cambiar a borrador y agregar nota de rechazo en el título (temporal)
      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'borrador',
          title: `[RECHAZADO: ${rejectReason}] ${selectedAnnouncement.title}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAnnouncement.id);

      if (error) throw error;

      setRejectModalOpen(false);
      setSelectedAnnouncement(null);
      setRejectReason('');
      setError('');
      loadData();
    } catch (error: any) {
      console.error('Error rejecting announcement:', error);
      alert('Error al rechazar el comunicado');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!selectedAnnouncement) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'archivado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAnnouncement.id);

      if (error) throw error;

      setArchiveModalOpen(false);
      setSelectedAnnouncement(null);
      loadData();
    } catch (error: any) {
      console.error('Error archiving announcement:', error);
      alert('Error al archivar el comunicado');
    } finally {
      setSaving(false);
    }
  }

  function getStatusBadge(status: AnnouncementStatus) {
    const badges = {
      borrador: <Badge variant="warning">Borrador</Badge>,
      pendiente_aprobacion: <Badge variant="info">Pendiente Aprobación</Badge>,
      publicado: <Badge variant="success">Publicado</Badge>,
      archivado: <Badge variant="secondary">Archivado</Badge>,
    };
    return badges[status] || <Badge variant="secondary">{status}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    if (priority === 'alta') return <Badge variant="error">Alta</Badge>;
    if (priority === 'media') return <Badge variant="warning">Media</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  }

  function getAudienceLabel(announcement: Announcement) {
    if (announcement.audience === 'seccion_especifica' && announcement.section) {
      return `${announcement.section.grade_level.name} - Sección ${announcement.section.section_letter}`;
    }
    const labels: Record<AnnouncementAudience, string> = {
      todos: 'Toda la institución',
      docentes: 'Docentes',
      estudiantes: 'Estudiantes',
      apoderados: 'Apoderados',
      seccion_especifica: 'Sección específica',
    };
    return labels[announcement.audience] || announcement.audience;
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterStatus !== 'all' && announcement.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    pendiente: announcements.filter((a) => a.status === 'pendiente_aprobacion').length,
    publicado: announcements.filter((a) => a.status === 'publicado').length,
    archivado: announcements.filter((a) => a.status === 'archivado').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Revisión de Comunicados</h1>
          <p className="text-[#334155] mt-1">Aprueba o rechaza comunicados pendientes</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Pendientes</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.pendiente}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-[#3B82F6]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Publicados</p>
                <p className="text-2xl font-bold text-[#10B981]">{stats.publicado}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Archivados</p>
                <p className="text-2xl font-bold text-[#64748B]">{stats.archivado}</p>
              </div>
              <Archive className="w-8 h-8 text-[#64748B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Filtros</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            label="Estado"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pendiente_aprobacion">Pendiente Aprobación</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </Select>
        </CardContent>
      </Card>

      {/* Lista de comunicados */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Comunicados ({filteredAnnouncements.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-[#64748B]">No hay comunicados para revisar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-[#E2E8F0] rounded-lg p-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(announcement.status)}
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-[#64748B] mb-3">
                        {announcement.content.substring(0, 150)}
                        {announcement.content.length > 150 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>👤 {announcement.creator.full_name}</span>
                        <span>📢 {getAudienceLabel(announcement)}</span>
                        <span>
                          📅 {new Date(announcement.created_at).toLocaleDateString('es-PE')}
                        </span>
                        {announcement.published_at && (
                          <span>
                            ✅ Publicado:{' '}
                            {new Date(announcement.published_at).toLocaleDateString('es-PE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(announcement)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {announcement.status === 'pendiente_aprobacion' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openApproveModal(announcement)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRejectModal(announcement)}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {announcement.status === 'publicado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openArchiveModal(announcement)}
                        >
                          <Archive className="w-4 h-4 text-[#64748B]" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detalle del Comunicado"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedAnnouncement.status)}
              {getPriorityBadge(selectedAnnouncement.priority)}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                {selectedAnnouncement.title}
              </h3>
              <div className="space-y-1 text-sm text-[#64748B]">
                <p>👤 Creado por: {selectedAnnouncement.creator.full_name}</p>
                <p>📢 Audiencia: {getAudienceLabel(selectedAnnouncement)}</p>
                {selectedAnnouncement.approver && (
                  <p>✅ Aprobado por: {selectedAnnouncement.approver.full_name}</p>
                )}
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-[#0F172A] whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>

            {selectedAnnouncement.attachment_url && (
              <div className="border-t border-[#E2E8F0] pt-4">
                <p className="text-sm font-medium text-[#0F172A] mb-2">Archivo adjunto:</p>
                <a
                  href={selectedAnnouncement.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline"
                >
                  📎 Ver archivo
                </a>
              </div>
            )}

            <div className="border-t border-[#E2E8F0] pt-4 text-sm text-[#64748B]">
              <p>📅 Creado: {new Date(selectedAnnouncement.created_at).toLocaleDateString('es-PE')}</p>
              {selectedAnnouncement.published_at && (
                <p>✅ Publicado: {new Date(selectedAnnouncement.published_at).toLocaleDateString('es-PE')}</p>
              )}
              {selectedAnnouncement.expires_at && (
                <p>⏰ Expira: {new Date(selectedAnnouncement.expires_at).toLocaleDateString('es-PE')}</p>
              )}
            </div>

            <Button onClick={() => setDetailModalOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal de aprobación */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Aprobar Comunicado"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <p className="text-[#0F172A]">
              ¿Estás seguro de que deseas aprobar y publicar el comunicado "
              {selectedAnnouncement.title}"?
            </p>
            <p className="text-sm text-[#64748B]">
              El comunicado será visible para: {getAudienceLabel(selectedAnnouncement)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setApproveModalOpen(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {saving ? 'Aprobando...' : 'Aprobar y Publicar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de rechazo */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Rechazar Comunicado"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <p className="text-[#0F172A]">
              ¿Por qué deseas rechazar el comunicado "{selectedAnnouncement.title}"?
            </p>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Motivo del rechazo
              </label>
              <textarea
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué se rechaza este comunicado..."
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={saving}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {saving ? 'Rechazando...' : 'Rechazar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de archivo */}
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="Archivar Comunicado"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <p className="text-[#0F172A]">
              ¿Estás seguro de que deseas archivar el comunicado "{selectedAnnouncement.title}"?
            </p>
            <p className="text-sm text-[#64748B]">
              El comunicado dejará de ser visible para los usuarios pero permanecerá en el historial.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setArchiveModalOpen(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleArchive}
                className="flex-1"
                disabled={saving}
              >
                <Archive className="w-4 h-4 mr-2" />
                {saving ? 'Archivando...' : 'Archivar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
