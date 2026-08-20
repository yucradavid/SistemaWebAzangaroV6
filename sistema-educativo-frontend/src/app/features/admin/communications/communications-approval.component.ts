//src/app/features/admin/communications/communications-approval.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { MessagingService, Announcement } from '@core/services/messaging.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-communications-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './communications-approval.component.html',
  styleUrls: ['./communications-approval.component.css']
})
export class CommunicationsApprovalComponent implements OnInit {
  stats = [
    { label: 'Pendientes', value: 0, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
    { label: 'Publicados', value: 0, iconColor: 'text-green-500', bgColor: 'bg-green-50', icon: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { label: 'Archivados', value: 0, iconColor: 'text-slate-400', bgColor: 'bg-slate-50', icon: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>' },
    { label: 'Promedio', value: '0 h', iconColor: 'text-blue-500', bgColor: 'bg-blue-50', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  ];

  pendingAnnouncements: Announcement[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  audienceFilter = '';
  creatorFilter = '';
  selectedAnnouncement: Announcement | null = null;

  private readonly processingIds = new Set<string>();

  constructor(private messagingService: MessagingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  get creatorOptions(): string[] {
    return Array.from(new Set(this.pendingAnnouncements.map((announcement) => this.getCreatorLabel(announcement))))
      .sort((left, right) => left.localeCompare(right));
  }

  get filteredAnnouncements(): Announcement[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.pendingAnnouncements.filter((announcement) => {
      if (this.audienceFilter && announcement.audience !== this.audienceFilter) {
        return false;
      }

      if (this.creatorFilter && this.getCreatorLabel(announcement) !== this.creatorFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        announcement.title,
        announcement.content,
        this.getCreatorLabel(announcement),
        this.getAudienceLabel(announcement),
        this.getSectionLabel(announcement),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get averageReviewHours(): string {
    if (!this.pendingAnnouncements.length) {
      return '0 h';
    }

    const totalHours = this.pendingAnnouncements.reduce((sum, announcement) => {
      const createdAt = announcement.created_at ? new Date(announcement.created_at).getTime() : Date.now();
      const diffMs = Date.now() - createdAt;
      return sum + Math.max(diffMs / (1000 * 60 * 60), 0);
    }, 0);

    return `${(totalHours / this.pendingAnnouncements.length).toFixed(1)} h`;
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      pending: this.messagingService.getAnnouncements({ status: 'pendiente_aprobacion' }),
      published: this.messagingService.getAnnouncements({ status: 'publicado' }),
      archived: this.messagingService.getAnnouncements({ status: 'archivado' })
    }).subscribe({
      next: ({ pending, published, archived }) => {
        this.pendingAnnouncements = this.normalizeAnnouncements(pending.data || []);
        this.stats[0].value = pending.total ?? this.pendingAnnouncements.length;
        this.stats[1].value = published.total ?? (published.data || []).length;
        this.stats[2].value = archived.total ?? (archived.data || []).length;
        this.stats[3].value = this.averageReviewHours;

        if (this.selectedAnnouncement) {
          this.selectedAnnouncement = this.pendingAnnouncements.find((item) => item.id === this.selectedAnnouncement?.id) || null;
        }

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'No se pudo cargar la cola de aprobacion de comunicados.';
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.audienceFilter = '';
    this.creatorFilter = '';
  }

  openDetail(announcement: Announcement): void {
    this.selectedAnnouncement = announcement;
  }

  closeDetail(): void {
    this.selectedAnnouncement = null;
  }

  getCreatorLabel(comm: Announcement): string {
    return comm.creator?.full_name || 'Administracion';
  }

  getAudienceLabel(comm: Announcement): string {
    if (comm.audience !== 'seccion_especifica') {
      const labels: Record<string, string> = {
        todos: 'Todos',
        docentes: 'Docentes',
        estudiantes: 'Estudiantes',
        apoderados: 'Apoderados'
      };

      return labels[comm.audience] || comm.audience;
    }

    return this.getSectionLabel(comm);
  }

  getSectionLabel(comm: Announcement): string {
    const gradeName = comm.section?.grade_level?.name || comm.section?.gradeLevel?.name || '';
    const sectionName = comm.section?.name || comm.section?.section_letter || '';

    if (!gradeName && !sectionName) {
      return 'Seccion especifica';
    }

    return [gradeName, sectionName ? `Seccion ${sectionName}` : ''].filter(Boolean).join(' - ');
  }

  isProcessing(id: string): boolean {
    return this.processingIds.has(id);
  }

  approve(announcement: Announcement): void {
    if (!this.hasUsableId(announcement.id)) {
      this.error = 'No se pudo aprobar el comunicado porque el identificador recibido es invalido.';
      this.loadData();
      return;
    }

    Swal.fire({
      title: 'Aprobar y publicar?',
      text: 'El comunicado sera visible para la audiencia seleccionada de inmediato.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, publicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.processingIds.add(announcement.id);

      this.messagingService.approveAnnouncement(announcement.id).subscribe({
        next: () => {
          this.processingIds.delete(announcement.id);
          this.closeDetail();
          Swal.fire({
            icon: 'success',
            title: 'Publicado',
            text: 'El comunicado fue aprobado y el docente fue notificado.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
          });
          this.loadData();
        },
        error: (error) => {
          this.processingIds.delete(announcement.id);
          Swal.fire('Error', error?.error?.message || 'No se pudo aprobar el comunicado.', 'error');
        }
      });
    });
  }

  archive(announcement: Announcement): void {
    if (!this.hasUsableId(announcement.id)) {
      this.error = 'No se pudo archivar el comunicado porque el identificador recibido es invalido.';
      this.loadData();
      return;
    }

    Swal.fire({
      title: 'Rechazar comunicado',
      text: 'Escribe una observacion para el docente. Esta se enviara como notificacion.',
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Ej: Ajustar el publico objetivo y corregir la redaccion del segundo parrafo.',
      inputAttributes: {
        'aria-label': 'Observacion de rechazo'
      },
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes escribir una observacion de rechazo.';
        }

        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.processingIds.add(announcement.id);

      this.messagingService.archiveAnnouncement(announcement.id, {
        review_comment: result.value?.trim()
      } as any).subscribe({
        next: () => {
          this.processingIds.delete(announcement.id);
          this.closeDetail();
          Swal.fire({
            icon: 'info',
            title: 'Comunicado rechazado',
            text: 'El docente recibio la observacion de revision.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
          });
          this.loadData();
        },
        error: (error) => {
          this.processingIds.delete(announcement.id);
          Swal.fire('Error', error?.error?.message || 'No se pudo archivar el comunicado.', 'error');
        }
      });
    });
  }

  private normalizeAnnouncements(rows: Announcement[]): Announcement[] {
    return rows.map((announcement) => ({
      ...announcement,
      id: typeof announcement.id === 'string' ? announcement.id : String(announcement.id ?? '')
    }));
  }

  private hasUsableId(id: string | undefined | null): id is string {
    return typeof id === 'string' && id.trim().length > 0;
  }
}
