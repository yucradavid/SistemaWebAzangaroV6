//src/app/features/teacher/communications/teacher-communications/teacher-communications.component.ts
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import Swal from 'sweetalert2';
import { AcademicService, TeacherCourseAssignment } from '@core/services/academic.service';
import { Announcement, MessagingService } from '@core/services/messaging.service';

interface TeacherSectionOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-teacher-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-communications.component.html',
  styleUrls: ['./teacher-communications.component.css']
})
export class TeacherCommunicationsComponent implements OnInit, AfterViewInit {
  private readonly messagingService = inject(MessagingService);
  private readonly academicService = inject(AcademicService);

  communications: Announcement[] = [];
  sections: TeacherSectionOption[] = [];

  loading = false;
  saving = false;
  error = '';
  filterStatus = '';
  filterAudience = '';

  isModalOpen = false;
  editingAnnouncement: Announcement | null = null;
  newComm = {
    title: '',
    audience: 'apoderados',
    section_id: '',
    content: ''
  };

  readonly audienceOptions = [
    { value: 'estudiantes', label: 'Solo estudiantes' },
    { value: 'apoderados', label: 'Solo apoderados' },
    { value: 'todos', label: 'Toda la comunidad' },
    { value: 'seccion_especifica', label: 'Seccion especifica' },
  ];

  readonly statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'pendiente_aprobacion', label: 'Pendiente de aprobacion' },
    { value: 'publicado', label: 'Publicado' },
    { value: 'archivado', label: 'Archivado' },
  ];

  ngOnInit(): void {
    this.loadTeacherSections();
    this.loadCommunications();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  get totalCommunications(): number {
    return this.communications.length;
  }

  get publishedCount(): number {
    return this.communications.filter((communication) => communication.status === 'publicado').length;
  }

  get draftCount(): number {
    return this.communications.filter((communication) => communication.status === 'borrador').length;
  }

  get pendingCount(): number {
    return this.communications.filter((communication) => communication.status === 'pendiente_aprobacion').length;
  }

  get requiresSection(): boolean {
    return this.newComm.audience === 'seccion_especifica';
  }

  get canSubmit(): boolean {
    return !!this.newComm.title.trim()
      && !!this.newComm.content.trim()
      && !!this.newComm.audience
      && (!this.requiresSection || !!this.newComm.section_id)
      && !this.saving;
  }

  openModal(announcement?: Announcement): void {
    this.editingAnnouncement = announcement || null;
    this.error = '';

    if (announcement) {
      this.newComm = {
        title: announcement.title,
        audience: announcement.audience,
        section_id: announcement.section_id || '',
        content: announcement.content
      };
    } else {
      this.newComm = {
        title: '',
        audience: 'apoderados',
        section_id: '',
        content: ''
      };
    }

    this.isModalOpen = true;
    this.refreshIcons();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingAnnouncement = null;
    this.newComm = {
      title: '',
      audience: 'apoderados',
      section_id: '',
      content: ''
    };
  }

  onAudienceChange(): void {
    if (!this.requiresSection) {
      this.newComm.section_id = '';
    }
  }

  applyFilters(): void {
    this.loadCommunications();
  }

  submitComm(): void {
    if (!this.canSubmit) {
      return;
    }

    if (this.editingAnnouncement && !this.hasValidAnnouncementId(this.editingAnnouncement)) {
      this.handleInvalidAnnouncementId();
      return;
    }

    this.saving = true;
    this.error = '';
    const isEditing = !!this.editingAnnouncement;

    const payload = {
      title: this.newComm.title.trim(),
      audience: this.newComm.audience as Announcement['audience'],
      section_id: this.requiresSection ? this.newComm.section_id : undefined,
      content: this.newComm.content.trim()
    };

    const request = this.editingAnnouncement
      ? this.messagingService.updateAnnouncement(this.editingAnnouncement.id, payload)
      : this.messagingService.createAnnouncement(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadCommunications();
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Comunicado actualizado' : 'Borrador creado',
          text: isEditing
            ? 'El comunicado se actualizo correctamente.'
            : 'El comunicado se guardo como borrador.',
          toast: true,
          position: 'top-end',
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.saving = false;
        this.error = error?.error?.message || 'No se pudo guardar el comunicado.';
      }
    });
  }

  requestApproval(announcement: Announcement): void {
    if (!this.hasValidAnnouncementId(announcement)) {
      this.handleInvalidAnnouncementId();
      return;
    }

    Swal.fire({
      title: 'Enviar a aprobacion?',
      text: 'El comunicado pasara a revision administrativa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d4ed8'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.messagingService.requestApproval(announcement.id).subscribe({
        next: () => {
          this.loadCommunications();
          Swal.fire({
            icon: 'success',
            title: 'Enviado',
            text: 'El comunicado fue enviado a aprobacion.',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false
          });
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo solicitar aprobacion.', 'error');
        }
      });
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (!this.hasValidAnnouncementId(announcement)) {
      this.handleInvalidAnnouncementId();
      return;
    }

    Swal.fire({
      title: 'Eliminar comunicado?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.messagingService.deleteAnnouncement(announcement.id).subscribe({
        next: () => {
          this.loadCommunications();
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El comunicado fue eliminado.',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false
          });
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el comunicado.', 'error');
        }
      });
    });
  }

  getAudienceLabel(announcement: Announcement): string {
    if (announcement.audience === 'seccion_especifica') {
      return this.getSectionLabelById(announcement.section_id || announcement.section?.id || '');
    }

    const labels: Record<string, string> = {
      estudiantes: 'Solo estudiantes',
      apoderados: 'Solo apoderados',
      todos: 'Toda la comunidad',
      docentes: 'Docentes'
    };

    return labels[announcement.audience] || announcement.audience;
  }

  getStatusLabel(status: Announcement['status']): string {
    const labels: Record<Announcement['status'], string> = {
      borrador: 'Borrador',
      pendiente_aprobacion: 'Pendiente',
      publicado: 'Publicado',
      archivado: 'Archivado'
    };

    return labels[status];
  }

  getStatusClass(status: Announcement['status']): string {
    const classes: Record<Announcement['status'], string> = {
      borrador: 'bg-slate-100 text-slate-700 ring-slate-200',
      pendiente_aprobacion: 'bg-amber-50 text-amber-700 ring-amber-200',
      publicado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      archivado: 'bg-purple-50 text-purple-700 ring-purple-200'
    };

    return classes[status];
  }

  canEdit(announcement: Announcement): boolean {
    return announcement.status === 'borrador';
  }

  canRequestApproval(announcement: Announcement): boolean {
    return announcement.status === 'borrador';
  }

  canDelete(announcement: Announcement): boolean {
    return announcement.status === 'borrador' || announcement.status === 'pendiente_aprobacion';
  }

  private loadCommunications(): void {
    this.loading = true;
    this.error = '';

    this.messagingService.getAnnouncements({
      status: this.filterStatus || undefined,
      audience: this.filterAudience || undefined
    }).subscribe({
      next: (response) => {
        this.communications = (response.data || []).map((announcement) => ({
          ...announcement,
          id: typeof announcement.id === 'string' ? announcement.id : String(announcement.id ?? '')
        }));
        this.loading = false;
        this.refreshIcons();
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'No se pudieron cargar los comunicados del docente.';
      }
    });
  }

  private loadTeacherSections(): void {
    this.academicService.getTeacherCourseAssignments({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        const assignments = this.extractRows<TeacherCourseAssignment>(response);
        const map = new Map<string, TeacherSectionOption>();

        assignments.forEach((assignment) => {
          const sectionId = assignment.section?.id || assignment.section_id;
          if (!sectionId || map.has(sectionId)) {
            return;
          }

          const gradeName = (assignment.section as any)?.grade_level?.name || (assignment.section as any)?.gradeLevel?.name || '';
          const sectionLetter = assignment.section?.section_letter || '';
          const label = [gradeName, sectionLetter ? `Seccion ${sectionLetter}` : '']
            .filter(Boolean)
            .join(' - ') || 'Seccion';

          map.set(sectionId, { id: sectionId, label });
        });

        this.sections = Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label));
      }
    });
  }

  private getSectionLabelById(sectionId: string): string {
    return this.sections.find((section) => section.id === sectionId)?.label || 'Seccion especifica';
  }

  private extractRows<T>(response: { data?: T[] } | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data || [];
  }

  private hasValidAnnouncementId(announcement: Announcement | null): announcement is Announcement {
    const id = announcement?.id;

    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  private handleInvalidAnnouncementId(): void {
    this.loadCommunications();
    Swal.fire(
      'Comunicado invalido',
      'Se detecto un identificador no valido. La lista se recargo para sincronizar los datos.',
      'warning'
    );
  }

  private refreshIcons(): void {
    setTimeout(() => createIcons({ icons }), 0);
  }
}
