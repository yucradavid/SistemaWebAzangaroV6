//src/app/features/student/communications/student-communications.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';
import { Announcement, MessagingService } from '@core/services/messaging.service';

interface Communication {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'media' | 'urgente';
  author: string;
  category: string;
  read: boolean;
}

@Component({
  selector: 'app-communications-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <a routerLink="/app/dashboard/student" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium group">
        <div class="p-1.5 bg-white border border-slate-200 rounded-lg group-hover:bg-slate-50 transition-colors shadow-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        Volver al Panel
      </a>

      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Mis Comunicados</h1>
        <p class="text-slate-500 font-medium leading-relaxed">Mantente informado sobre las ultimas novedades del colegio</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-[32px] p-8 transition-all hover:shadow-lg group">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Total</p>
              <p class="text-4xl font-black text-slate-900">{{ allComms.length }}</p>
            </div>
            <div [innerHTML]="getSafeIcon('megaphone')" class="w-12 h-12 text-pink-500 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-[32px] p-8 transition-all hover:shadow-lg group border-l-4 border-l-blue-500">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Nuevos <span class="text-[10px] lowercase font-medium text-slate-400">(ultimos 3 dias)</span></p>
              <p class="text-4xl font-black text-blue-600">{{ getNewCount() }}</p>
            </div>
            <div [innerHTML]="getSafeIcon('sparkles')" class="w-12 h-12 text-amber-400 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-[32px] p-8 transition-all hover:shadow-lg group border-l-4 border-l-red-500">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Alta Prioridad</p>
              <p class="text-4xl font-black text-red-600">{{ getHighPriorityCount() }}</p>
            </div>
            <div [innerHTML]="getSafeIcon('alertTriangle')" class="w-12 h-12 text-orange-500 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
          <div [innerHTML]="getSafeIcon('filter')" class="w-5 h-5 text-slate-400"></div>
          <h2 class="text-lg font-black text-slate-900 tracking-tight">Filtros</h2>
        </div>
        <div class="p-8">
          <div class="max-w-xs space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prioridad</label>
            <select [(ngModel)]="priorityFilter" (change)="filterCommunications()"
                    class="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none">
              <option value="all">Todas</option>
              <option value="urgente">Alta</option>
              <option value="media">Media</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-[400px]">
        <div class="px-8 py-6 border-b border-slate-50">
          <h2 class="text-lg font-black text-slate-900 tracking-tight">Comunicados ({{ filteredComms.length }})</h2>
        </div>

        <div class="p-8">
          <div *ngIf="loading" class="flex flex-col items-center justify-center py-24 gap-6">
            <div class="relative w-16 h-16">
              <div class="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div class="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando anuncios...</p>
          </div>

          <div *ngIf="!loading && error" class="rounded-3xl border border-red-100 bg-red-50 px-6 py-5 text-sm font-semibold text-red-700">
            {{ error }}
          </div>

          <div *ngIf="!loading && !error && filteredComms.length === 0" class="text-center py-24 space-y-6">
            <div class="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner transform rotate-3">
               <div [innerHTML]="getSafeIcon('inbox')" class="w-12 h-12 text-indigo-300"></div>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-black text-slate-900 tracking-tight">No hay comunicados disponibles</h3>
              <p class="text-slate-400 font-medium">Vuelve mas tarde para revisar nuevas actualizaciones</p>
            </div>
          </div>

          <div *ngIf="!loading && !error && filteredComms.length > 0" class="divide-y divide-slate-100 border border-slate-100 rounded-[32px] overflow-hidden">
            <div *ngFor="let comm of filteredComms"
                 (click)="openComm(comm)"
                 class="p-6 transition-all hover:bg-slate-50/50 cursor-pointer group flex items-start gap-6">

              <div class="flex-1 space-y-4">
                <div class="flex items-center gap-3">
                  <span *ngIf="isNew(comm)" class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">NUEVO</span>
                  <span [class]="'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ' + getPriorityStyles(comm.priority)">
                    {{ comm.priority === 'urgente' ? 'ALTA PRIORIDAD' : comm.priority | uppercase }}
                  </span>
                </div>

                <div class="space-y-2">
                  <h3 class="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{{ comm.title }}</h3>
                  <p class="text-slate-500 font-medium line-clamp-2 leading-relaxed text-sm max-w-4xl">{{ comm.content }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span class="flex items-center gap-2">Categoria: {{ comm.category }}</span>
                  <span class="flex items-center gap-2">Fecha: {{ comm.date | date:'shortDate' }}</span>
                  <span class="flex items-center gap-2">Autor: {{ comm.author }}</span>
                </div>
              </div>

              <button class="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                <div [innerHTML]="getSafeIcon('eye')" class="w-5 h-5"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="selectedComm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all" (click)="selectedComm = null">
      <div class="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative" (click)="$event.stopPropagation()">
        <button (click)="selectedComm = null" class="absolute top-6 right-6 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors shadow-sm">
          <svg class="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="p-8 sm:p-12 space-y-8">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <span *ngIf="selectedComm.priority === 'urgente'" class="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Urgente</span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ selectedComm.date | date:'fullDate':'':'es-PE' }}</span>
            </div>
            <h2 class="text-3xl font-black text-slate-900 leading-tight tracking-tight">{{ selectedComm.title }}</h2>
          </div>

          <div class="prose prose-slate max-w-none">
            <p class="text-slate-600 leading-relaxed font-semibold text-lg whitespace-pre-line">{{ selectedComm.content }}</p>
          </div>

          <div class="pt-8 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-600 uppercase">{{ selectedComm.author.slice(0,2) }}</div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Publicado por</p>
                <p class="text-sm font-black text-slate-900">{{ selectedComm.author }}</p>
              </div>
            </div>
            <button (click)="selectedComm = null" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              ENTENDIDO
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #F8FAFC; min-h: 100vh; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; }
  `]
})
export class CommunicationsStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private messagingService = inject(MessagingService);

  loading = false;
  activeTab = 'all';
  searchQuery = '';
  priorityFilter = 'all';
  selectedComm: Communication | null = null;
  error = '';

  allComms: Communication[] = [];
  filteredComms: Communication[] = [];

  ngOnInit() {
    this.loadCommunications();
  }

  loadCommunications() {
    this.loading = true;
    this.error = '';

    this.messagingService.getAnnouncements({ status: 'publicado' }).subscribe({
      next: (response) => {
        this.allComms = (response.data || [])
          .map((announcement) => this.mapAnnouncementToCommunication(announcement))
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

        this.filterCommunications();
        this.loading = false;
      },
      error: (error) => {
        this.allComms = [];
        this.filteredComms = [];
        this.loading = false;
        this.error = error?.error?.message || 'No se pudieron cargar los comunicados.';
      }
    });
  }

  getNewCount(): number {
    return this.allComms.filter(c => this.isNew(c)).length;
  }

  getHighPriorityCount(): number {
    return this.allComms.filter(c => c.priority === 'urgente').length;
  }

  isNew(comm: Communication): boolean {
    const publishedDate = new Date(comm.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return publishedDate > threeDaysAgo;
  }

  getPriorityStyles(priority: string): string {
    const map: Record<string, string> = {
      urgente: 'bg-red-50 text-red-600 border border-red-100',
      media: 'bg-orange-50 text-orange-600 border border-orange-100',
      normal: 'bg-slate-50 text-slate-500 border border-slate-100',
    };
    return map[priority] || map['normal'];
  }

  filterCommunications() {
    let filtered = [...this.allComms];

    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === this.priorityFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query)
      );
    }

    this.filteredComms = filtered;
  }

  getSafeIcon(name: string): SafeHtml {
    const map: Record<string, string> = {
      megaphone: ICONS.megaphone,
      sparkles: ICONS.sparkles,
      alertTriangle: ICONS.alertTriangle,
      filter: ICONS.filter,
      inbox: ICONS.inbox,
      eye: ICONS.eye,
      search: ICONS.search
    };
    const svg = map[name] || ICONS.newspaper;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  openComm(comm: Communication) {
    this.selectedComm = comm;
    comm.read = true;
    this.filterCommunications();
  }

  private mapAnnouncementToCommunication(announcement: Announcement): Communication {
    return {
      id: typeof announcement.id === 'string' ? announcement.id : String(announcement.id ?? ''),
      title: announcement.title || 'Comunicado',
      content: announcement.content || '',
      date: announcement.published_at || announcement.created_at || new Date().toISOString(),
      priority: this.mapPriority(announcement.priority),
      author: announcement.creator?.full_name || announcement.creator?.user?.name || 'Institucion',
      category: this.getAudienceLabel(announcement),
      read: false
    };
  }

  private mapPriority(priority: string | null | undefined): Communication['priority'] {
    const normalized = String(priority || '').toLowerCase();

    if (normalized === 'urgente' || normalized === 'alta' || normalized === 'high') {
      return 'urgente';
    }

    if (normalized === 'media' || normalized === 'medio' || normalized === 'medium') {
      return 'media';
    }

    return 'normal';
  }

  private getAudienceLabel(announcement: Announcement): string {
    if (announcement.audience === 'seccion_especifica') {
      const gradeName = announcement.section?.grade_level?.name || announcement.section?.gradeLevel?.name || '';
      const sectionLetter = announcement.section?.section_letter || announcement.section?.name || '';

      return [gradeName, sectionLetter ? `Seccion ${sectionLetter}` : '']
        .filter(Boolean)
        .join(' - ') || 'Seccion especifica';
    }

    const labels: Record<string, string> = {
      todos: 'Toda la institucion',
      estudiantes: 'Estudiantes',
      apoderados: 'Apoderados',
      docentes: 'Docentes'
    };

    return labels[announcement.audience] || 'Comunicado';
  }
}
