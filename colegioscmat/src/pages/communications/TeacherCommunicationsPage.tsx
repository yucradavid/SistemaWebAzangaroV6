import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Send, Eye, FileText, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
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
}

interface Course {
  id: string;
  name: string;
  section_id: string;
  section: {
    section_letter: string;
    grade_level: {
      name: string;
      level: string;
    };
  };
}

export function TeacherCommunicationsPage() {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'seccion_especifica' as AnnouncementAudience,
    section_id: '',
    priority: 'normal',
    attachment_url: '',
    expires_at: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);

      // Obtener año académico activo
      const { data: activeYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_active', true)
        .single();

      if (yearError) throw yearError;

      // Verificar si el usuario es admin/director/coordinator
      const isAdminRole = ['admin', 'director', 'coordinator'].includes(profile?.role || '');

      let coursesData;

      if (isAdminRole) {
        // Admin ve todos los cursos/secciones
        const { data, error: coursesError } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            course:courses(
              id,
              name
            ),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name, level)
            )
          `)
          .eq('academic_year_id', activeYear.id)
          .order('course_id');

        if (coursesError) throw coursesError;
        coursesData = data;
      } else {
        // Docente: solo ve sus cursos asignados
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!teacherData) {
          console.warn('No teacher record found for user');
          setCourses([]);
          setAnnouncements([]);
          setLoading(false);
          return;
        }

        const { data, error: coursesError } = await supabase
          .from('teacher_course_assignments')
          .select(`
            id,
            course_id,
            section_id,
            course:courses(
              id,
              name
            ),
            section:sections(
              id,
              section_letter,
              grade_level:grade_levels(name, level)
            )
          `)
          .eq('teacher_id', teacherData.id)
          .eq('academic_year_id', activeYear.id);

        if (coursesError) throw coursesError;
        coursesData = data;
      }

      const flatCourses = (coursesData || [])
        .filter((ca) => ca.course && ca.section)
        .map((ca) => ({
          id: ca.course.id,
          name: ca.course.name,
          section_id: ca.section.id,
          section: ca.section,
        }));

      setCourses(flatCourses);

      // Cargar comunicados creados por el docente
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          section:sections(
            section_letter,
            grade_level:grade_levels(name)
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      setAnnouncements(announcementsData || []);

      // Establecer primera sección como default
      if (flatCourses.length > 0) {
        setFormData((prev) => ({
          ...prev,
          section_id: flatCourses[0].section_id,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      audience: 'seccion_especifica',
      section_id: courses.length > 0 ? courses[0].section_id : '',
      priority: 'normal',
      attachment_url: '',
      expires_at: '',
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      audience: announcement.audience,
      section_id: announcement.section_id || '',
      priority: announcement.priority,
      attachment_url: announcement.attachment_url || '',
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
    });
    setError('');
    setModalOpen(true);
  }

  function openDetailModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement);
    setDetailModalOpen(true);
  }

  function openDeleteModal(announcement: Announcement) {
    setAnnouncementToDelete(announcement);
    setDeleteModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('El título y contenido son obligatorios');
      return;
    }

    if (formData.audience === 'seccion_especifica' && !formData.section_id) {
      setError('Debe seleccionar una sección');
      return;
    }

    try {
      setSaving(true);

      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        audience: formData.audience,
        section_id: formData.audience === 'seccion_especifica' ? formData.section_id : null,
        priority: formData.priority,
        attachment_url: formData.attachment_url.trim() || null,
        expires_at: formData.expires_at || null,
        status: 'borrador' as AnnouncementStatus,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingAnnouncement) {
        const { error: updateError } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (insertError) throw insertError;
      }

      setModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      setError(error.message || 'Error al guardar el comunicado');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForApproval(announcementId: string) {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'pendiente_aprobacion',
          updated_at: new Date().toISOString(),
        })
        .eq('id', announcementId);

      if (error) throw error;

      loadData();
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      alert('Error al enviar para aprobación');
    }
  }

  async function handleDelete() {
    if (!announcementToDelete) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementToDelete.id);

      if (error) throw error;

      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      alert('Error al eliminar el comunicado');
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
    if (filterCourse !== 'all' && announcement.section_id !== filterCourse) return false;
    return true;
  });

  const stats = {
    total: announcements.length,
    borrador: announcements.filter((a) => a.status === 'borrador').length,
    pendiente: announcements.filter((a) => a.status === 'pendiente_aprobacion').length,
    publicado: announcements.filter((a) => a.status === 'publicado').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Comunicados</h1>
          <p className="text-[#334155] mt-1">Gestiona los comunicados de tus cursos</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Comunicado
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Total</p>
                <p className="text-2xl font-bold text-[#0F172A]">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-[#3B82F6]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Borradores</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{stats.borrador}</p>
              </div>
              <Edit2 className="w-8 h-8 text-[#F59E0B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B]">Pendientes</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.pendiente}</p>
              </div>
              <Clock className="w-8 h-8 text-[#3B82F6]" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="pendiente_aprobacion">Pendiente Aprobación</option>
              <option value="publicado">Publicado</option>
              <option value="archivado">Archivado</option>
            </Select>

            <Select
              label="Sección"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="all">Todas</option>
              {courses.map((course) => (
                <option key={course.section_id} value={course.section_id}>
                  {course.section.grade_level.name} - {course.section.section_letter}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de comunicados */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Mis Comunicados ({filteredAnnouncements.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">No hay comunicados</p>
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
                        <h3 className="text-lg font-semibold text-[#0F172A]">
                          {announcement.title}
                        </h3>
                        {getStatusBadge(announcement.status)}
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <p className="text-sm text-[#64748B] mb-2">
                        {announcement.content.substring(0, 150)}
                        {announcement.content.length > 150 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>📢 {getAudienceLabel(announcement)}</span>
                        <span>📅 {new Date(announcement.created_at).toLocaleDateString('es-PE')}</span>
                        {announcement.published_at && (
                          <span>
                            ✅ Publicado el{' '}
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
                      {announcement.status === 'borrador' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(announcement)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitForApproval(announcement.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(announcement)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación/edición */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnnouncement ? 'Editar Comunicado' : 'Nuevo Comunicado'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              Contenido
            </label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <Select
            label="Audiencia"
            value={formData.audience}
            onChange={(e) =>
              setFormData({ ...formData, audience: e.target.value as AnnouncementAudience })
            }
          >
            <option value="seccion_especifica">Sección específica</option>
            <option value="todos">Toda la institución</option>
            <option value="docentes">Docentes</option>
            <option value="estudiantes">Estudiantes</option>
            <option value="apoderados">Apoderados</option>
          </Select>

          {formData.audience === 'seccion_especifica' && (
            <Select
              label="Sección"
              value={formData.section_id}
              onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
              required
            >
              <option value="">Seleccione una sección</option>
              {courses.map((course) => (
                <option key={course.section_id} value={course.section_id}>
                  {course.section.grade_level.name} - Sección {course.section.section_letter} (
                  {course.name})
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Prioridad"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="normal">Normal</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </Select>

          <Input
            label="Archivo adjunto (URL)"
            type="url"
            value={formData.attachment_url}
            onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
            placeholder="https://ejemplo.com/archivo.pdf"
          />

          <Input
            label="Fecha de expiración (opcional)"
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : editingAnnouncement ? 'Actualizar' : 'Crear Borrador'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

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
              <p className="text-sm text-[#64748B] mb-4">
                📢 {getAudienceLabel(selectedAnnouncement)}
              </p>
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
              <p>
                📅 Creado: {new Date(selectedAnnouncement.created_at).toLocaleDateString('es-PE')}
              </p>
              {selectedAnnouncement.published_at && (
                <p>
                  ✅ Publicado:{' '}
                  {new Date(selectedAnnouncement.published_at).toLocaleDateString('es-PE')}
                </p>
              )}
              {selectedAnnouncement.expires_at && (
                <p>
                  ⏰ Expira: {new Date(selectedAnnouncement.expires_at).toLocaleDateString('es-PE')}
                </p>
              )}
            </div>

            <Button onClick={() => setDetailModalOpen(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Comunicado"
      >
        {announcementToDelete && (
          <div className="space-y-4">
            <p className="text-[#0F172A]">
              ¿Estás seguro de que deseas eliminar el comunicado "{announcementToDelete.title}"?
            </p>
            <p className="text-sm text-[#64748B]">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
