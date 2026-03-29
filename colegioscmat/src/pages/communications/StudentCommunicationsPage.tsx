import { useState, useEffect } from 'react';
import { Eye, Filter, AlertCircle } from 'lucide-react';
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

interface Student {
  id: string;
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

export function StudentCommunicationsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);

      // Cargar datos del estudiante
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          section_id,
          section:sections(
            section_letter,
            grade_level:grade_levels(name, level, grade)
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        console.log('No student record found for this user');
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Cargar comunicados publicados dirigidos al estudiante
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          section:sections(
            section_letter,
            grade_level:grade_levels(name, level, grade)
          ),
          creator:profiles!announcements_created_by_fkey(full_name)
        `)
        .eq('status', 'publicado')
        .or(
          `audience.eq.todos,audience.eq.estudiantes,and(audience.eq.seccion_especifica,section_id.eq.${studentData.section_id})`
        )
        .order('published_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Filtrar comunicados por grado si es necesario
      const filteredAnnouncements = (announcementsData || []).filter((announcement) => {
        // Incluir todos los comunicados generales
        if (announcement.audience === 'todos' || announcement.audience === 'estudiantes') {
          return true;
        }
        // Incluir comunicados de la sección específica
        if (
          announcement.audience === 'seccion_especifica' &&
          announcement.section_id === studentData.section_id
        ) {
          return true;
        }
        return false;
      });

      setAnnouncements(filteredAnnouncements);
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

  function getPriorityBadge(priority: string) {
    if (priority === 'alta') return <Badge variant="error">Alta Prioridad</Badge>;
    if (priority === 'media') return <Badge variant="warning">Prioridad Media</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  }

  function getAudienceLabel(announcement: Announcement) {
    if (announcement.audience === 'todos') {
      return '🏫 Toda la institución';
    }
    if (announcement.audience === 'estudiantes') {
      return '🎓 Todos los estudiantes';
    }
    if (announcement.audience === 'seccion_especifica' && announcement.section) {
      if (student && announcement.section_id === student.section_id) {
        return `👥 Tu sección (${announcement.section.grade_level.name} - ${announcement.section.section_letter})`;
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

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Mis Comunicados</h1>
          <p className="text-[#334155] mt-1">
            {student && `${student.section.grade_level.name} - Sección ${student.section.section_letter}`}
          </p>
        </div>
      </div>

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
