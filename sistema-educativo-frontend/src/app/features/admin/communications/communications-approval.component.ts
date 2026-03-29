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
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Revision de Comunicados</h1>
          <p class="text-slate-500 text-sm font-medium">Aprueba, revisa y rechaza anuncios institucionales con contexto completo</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold uppercase tracking-wider border border-purple-100 italic">
            {{ filteredAnnouncements.length }} visibles / {{ pendingAnnouncements.length }} pendientes
          </div>
          <button
            (click)="loadData()"
            [disabled]="loading"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading ? 'Actualizando...' : 'Recargar' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div *ngFor="let stat of stats" class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
          <div class="flex items-start justify-between relative z-10">
            <div class="space-y-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{{ stat.label }}</p>
              <h3 class="text-2xl font-bold text-slate-900 tracking-tighter">{{ stat.value }}</h3>
            </div>
            <div [class]="'p-3 rounded-xl transition-colors ' + stat.bgColor">
              <svg class="w-6 h-6" [class]="stat.iconColor" [innerHTML]="stat.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
        {{ error }}
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div class="lg:col-span-2">
            <label class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Buscar</label>
            <input
              [(ngModel)]="searchTerm"
              type="text"
              placeholder="Titulo, contenido o docente..."
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Audiencia</label>
            <select [(ngModel)]="audienceFilter" class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none">
              <option value="">Todas</option>
              <option value="todos">Todos</option>
              <option value="docentes">Docentes</option>
              <option value="estudiantes">Estudiantes</option>
              <option value="apoderados">Apoderados</option>
              <option value="seccion_especifica">Seccion especifica</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Creador</label>
            <select [(ngModel)]="creatorFilter" class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none">
              <option value="">Todos</option>
              <option *ngFor="let creator of creatorOptions" [value]="creator">{{ creator }}</option>
            </select>
          </div>
        </div>

        <div class="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
          <button
            (click)="resetFilters()"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:border-slate-300 hover:text-slate-900 transition-colors">
            Limpiar filtros
          </button>
          <span class="text-xs font-medium text-slate-400">
            Tiempo promedio de revision: {{ averageReviewHours }}
          </span>
        </div>

        <div *ngIf="loading" class="p-16 text-center text-slate-400">
          Cargando comunicados pendientes...
        </div>

        <div *ngIf="!loading && filteredAnnouncements.length === 0" class="p-16 flex flex-col items-center justify-center text-center space-y-6">
          <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Sin resultados</h3>
            <p class="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-medium leading-relaxed">
              No hay comunicados pendientes que coincidan con tus filtros actuales.
            </p>
          </div>
        </div>

        <div class="divide-y divide-slate-50">
          <div *ngFor="let comm of filteredAnnouncements" class="p-8 hover:bg-slate-50/50 transition-all group scale-100 active:scale-[0.99]">
            <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
              <div class="space-y-4 flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight bg-purple-50 text-purple-600">
                    Pendiente de aprobacion
                  </span>
                  <span *ngIf="comm.priority" class="px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight bg-amber-50 text-amber-700">
                    {{ comm.priority }}
                  </span>
                  <span class="text-xs font-semibold text-slate-500">Por: {{ getCreatorLabel(comm) }}</span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors tracking-tight uppercase">{{ comm.title }}</h3>
                  <p class="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium whitespace-pre-line">
                    {{ comm.content }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                  <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{{ getAudienceLabel(comm) }}</div>
                  <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>Creado el: {{ comm.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
                  <div *ngIf="comm.expires_at" class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Expira: {{ comm.expires_at | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-3">
                <button
                  (click)="openDetail(comm)"
                  class="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 hover:border-blue-200 hover:text-blue-700 text-slate-700 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                  Ver detalle
                </button>
                <button
                  (click)="approve(comm)"
                  [disabled]="isProcessing(comm.id)"
                  class="w-full sm:w-auto px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="w-5 h-5 line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ isProcessing(comm.id) ? 'Procesando...' : 'Aprobar' }}
                </button>
                <button
                  (click)="archive(comm)"
                  [disabled]="isProcessing(comm.id)"
                  class="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  {{ isProcessing(comm.id) ? 'Procesando...' : 'Rechazar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="selectedAnnouncement" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" (click)="closeDetail()"></div>
      <div class="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Detalle del comunicado</p>
            <h3 class="mt-2 text-2xl font-bold text-slate-900">{{ selectedAnnouncement.title }}</h3>
            <p class="mt-2 text-sm font-medium text-slate-500">Revisa el contenido completo antes de aprobar o rechazar.</p>
          </div>
          <button (click)="closeDetail()" class="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Creador</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ getCreatorLabel(selectedAnnouncement) }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Audiencia</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ getAudienceLabel(selectedAnnouncement) }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Creado</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ selectedAnnouncement.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Expiracion</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">{{ selectedAnnouncement.expires_at ? (selectedAnnouncement.expires_at | date:'dd/MM/yyyy HH:mm') : 'Sin vencimiento' }}</p>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-5">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Contenido completo</p>
            <div class="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{{ selectedAnnouncement.content }}</div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Historial</p>
              <div class="mt-3 space-y-3 text-sm text-slate-600">
                <div class="flex items-start justify-between gap-4">
                  <span>Creado por docente</span>
                  <span class="font-semibold text-slate-900">{{ selectedAnnouncement.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <span>Estado actual</span>
                  <span class="font-semibold text-purple-700">Pendiente de aprobacion</span>
                </div>
                <div *ngIf="selectedAnnouncement.published_at" class="flex items-start justify-between gap-4">
                  <span>Publicado</span>
                  <span class="font-semibold text-slate-900">{{ selectedAnnouncement.published_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Revision</p>
              <div class="mt-3 space-y-3 text-sm text-slate-600">
                <p>Al rechazar puedes escribir una observacion. Esa observacion se envia al docente como notificacion para que corrija el comunicado.</p>
                <p *ngIf="selectedAnnouncement.attachment_url" class="font-semibold text-blue-700 break-all">Adjunto: {{ selectedAnnouncement.attachment_url }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
          <button
            (click)="archive(selectedAnnouncement)"
            [disabled]="isProcessing(selectedAnnouncement.id)"
            class="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Rechazar con observacion
          </button>
          <button
            (click)="approve(selectedAnnouncement)"
            [disabled]="isProcessing(selectedAnnouncement.id)"
            class="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Aprobar y publicar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
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
