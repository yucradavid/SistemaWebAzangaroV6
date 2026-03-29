import { useState, useEffect } from 'react';
import { Eye, Filter, AlertCircle, Users } from 'lucide-react';
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
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  section?: {
    section_letter: string;
    grade_level: {
      name: string;
      level: string;
      grade: number;
    };
  };
  creator?: {
    full_name: string;
  };
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  section_id: string;
  section: {
    section_letter: string;
    grade_level: {
      name: string;
      level: string;
      grade: number;
    };
  };
}

export function GuardianCommunicationsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (children.length > 0) {
      loadAnnouncements();
    }
  }, [selectedChild, children]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);

      // Cargar datos del apoderado
      const { data: guardianList, error: guardianError } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', user.id);

      if (guardianError) throw guardianError;

      if (!guardianList || guardianList.length === 0) {
        console.log('No guardian record found for this user');
        setLoading(false);
        return;
      }

      const guardianData = guardianList[0];

      // Cargar hijos del apoderado
      const { data: childrenData, error: childrenError } = await supabase
        .from('student_guardians')
        .select(`
          student:students(
            id,
            first_name,
            last_name,
            section_id,
            section:sections(
              section_letter,
              grade_level:grade_levels(name, level, grade)
            )
          )
        `)
        .eq('guardian_id', guardianData.id);

      if (childrenError) throw childrenError;

      const childrenList = (childrenData || [])
        .filter((sg) => sg.student)
        .map((sg) => sg.student as Child);

      setChildren(childrenList);

      if (childrenList.length > 0) {
        setSelectedChild('all');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
      setLoading(false);
    }
  }

  async function loadAnnouncements() {
    try {
      setLoading(true);

      if (children.length === 0) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      // Obtener IDs de secciones de los hijos
      const sectionIds = selectedChild === 'all'
        ? children.map((child) => child.section_id)
        : [children.find((c) => c.id === selectedChild)?.section_id].filter(Boolean);

      if (sectionIds.length === 0) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      // Construir query para comunicados
      let query = supabase
        .from('announcements')
        .select(`
          *,
          section:sections(
            section_letter,
            grade_level:grade_levels(name, level, grade)
          ),
          creator:profiles!announcements_created_by_fkey(full_name)
        `)
        .eq('status', 'publicado');

      // Filtrar por audiencia relevante
      const orConditions = [
        'audience.eq.todos',
        'audience.eq.apoderados',
        ...sectionIds.map((id) => `and(audience.eq.seccion_especifica,section_id.eq.${id})`),
      ];

      query = query.or(orConditions.join(','));

      const { data: announcementsData, error: announcementsError } = await query.order(
        'published_at',
        { ascending: false }
      );

      if (announcementsError) throw announcementsError;

      setAnnouncements(announcementsData || []);
    } catch (error: any) {
      console.error('Error loading announcements:', error);
      setError('Error al cargar los comunicados');
    } finally {
      setLoading(false);
    }
  }

  function openDetailModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setDetailModalOpen(true);
  }

  function getPriorityBadge(priority: string) {
    if (priority === 'alta') return <Badge variant="error">Alta Prioridad</Badge>;
    if (priority === 'media') return <Badge variant="warning">Prioridad Media</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  }

  function getAudienceLabel(announcement: Announcement) {
    if (announcement.audience === 'todos') {
      return '🏫 Toda la institución';
    }
    if (announcement.audience === 'apoderados') {
      return '👨‍👩‍👧 Todos los apoderados';
    }
    if (announcement.audience === 'seccion_especifica' && announcement.section) {
      // Verificar si alguno de los hijos está en esta sección
      const childInSection = children.find((child) => child.section_id === announcement.section_id);
      if (childInSection) {
        return `👥 Sección de ${childInSection.first_name} (${announcement.section.grade_level.name} - ${announcement.section.section_letter})`;
      }
      return `👥 ${announcement.section.grade_level.name} - Sección ${announcement.section.section_letter}`;
    }
    return '📢 Comunicado';
  }

  function isNewAnnouncement(publishedAt: string | null): boolean {
    if (!publishedAt) return false;
    const publishedDate = new Date(publishedAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return publishedDate > threeDaysAgo;
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterPriority !== 'all' && announcement.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-[#64748B]">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
            <p className="text-center text-[#64748B]">
              No se encontraron hijos registrados
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Comunicados</h1>
          <p className="text-[#334155] mt-1">Información sobre tus hijos</p>
        </div>
      </div>

      {/* Selector de hijo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Seleccionar Hijo</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            label="Hijo"
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          >
            <option value="all">Todos mis hijos</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name} - {child.section.grade_level.name} Sección{' '}
                {child.section.section_letter}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Total</p>
                <p className="text-2xl font-bold text-[#0F172A]">{announcements.length}</p>
              </div>
              <div className="text-4xl">📢</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Nuevos (últimos 3 días)</p>
                <p className="text-2xl font-bold text-[#3B82F6]">
                  {announcements.filter((a) => isNewAnnouncement(a.published_at)).length}
                </p>
              </div>
              <div className="text-4xl">✨</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Alta Prioridad</p>
                <p className="text-2xl font-bold text-[#EF4444]">
                  {announcements.filter((a) => a.priority === 'alta').length}
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
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
            label="Prioridad"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="normal">Normal</option>
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
              <div className="text-6xl mb-4">📭</div>
              <p className="text-[#64748B]">No hay comunicados disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-[#E2E8F0] rounded-lg p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  onClick={() => openDetailModal(announcement)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isNewAnnouncement(announcement.published_at) && (
                          <Badge variant="info">Nuevo</Badge>
                        )}
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-[#64748B] mb-3">
                        {announcement.content.substring(0, 200)}
                        {announcement.content.length > 200 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>{getAudienceLabel(announcement)}</span>
                        <span>
                          📅 {new Date(announcement.published_at!).toLocaleDateString('es-PE')}
                        </span>
                        {announcement.attachment_url && <span>📎 Con archivo adjunto</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
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
        title="Comunicado"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isNewAnnouncement(selectedAnnouncement.published_at) && (
                <Badge variant="info">Nuevo</Badge>
              )}
              {getPriorityBadge(selectedAnnouncement.priority)}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                {selectedAnnouncement.title}
              </h3>
              <p className="text-sm text-[#64748B] mb-2">
                {getAudienceLabel(selectedAnnouncement)}
              </p>
              {selectedAnnouncement.creator && (
                <p className="text-sm text-[#64748B]">
                  📝 Publicado por: {selectedAnnouncement.creator.full_name}
                </p>
              )}
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
                  className="inline-flex items-center gap-2 text-[#3B82F6] hover:underline"
                >
                  📎 Descargar archivo
                </a>
              </div>
            )}

            <div className="border-t border-[#E2E8F0] pt-4 text-sm text-[#64748B]">
              <p>
                📅 Publicado:{' '}
                {new Date(selectedAnnouncement.published_at!).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              {selectedAnnouncement.expires_at && (
                <p className="text-orange-600 mt-1">
                  ⏰ Válido hasta:{' '}
                  {new Date(selectedAnnouncement.expires_at).toLocaleDateString('es-PE')}
                </p>
              )}
            </div>

            <Button onClick={() => setDetailModalOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
