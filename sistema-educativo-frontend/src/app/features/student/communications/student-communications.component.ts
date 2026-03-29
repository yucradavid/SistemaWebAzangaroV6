import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';

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
      <!-- Go Back Button -->
      <a routerLink="/app/dashboard/student" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium group">
        <div class="p-1.5 bg-white border border-slate-200 rounded-lg group-hover:bg-slate-50 transition-colors shadow-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        Volver al Panel
      </a>

      <!-- Header -->
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Mis Comunicados</h1>
        <p class="text-slate-500 font-medium leading-relaxed">Mantente informado sobre las últimas novedades del colegio</p>
      </div>

      <!-- KPI Cards (React Design) -->
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
              <p class="text-sm font-black text-slate-400 uppercase tracking-widest">Nuevos <span class="text-[10px] lowercase font-medium text-slate-400">(últimos 3 días)</span></p>
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

      <!-- Filters Card -->
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

      <!-- Communications List -->
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

          <!-- Empty State (React Design) -->
          <div *ngIf="!loading && filteredComms.length === 0" class="text-center py-24 space-y-6">
            <div class="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner transform rotate-3">
               <div [innerHTML]="getSafeIcon('inbox')" class="w-12 h-12 text-indigo-300"></div>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-black text-slate-900 tracking-tight">No hay comunicados disponibles</h3>
              <p class="text-slate-400 font-medium">Vuelve más tarde para revisar nuevas actualizaciones</p>
            </div>
          </div>

          <div *ngIf="!loading && filteredComms.length > 0" class="divide-y divide-slate-100 border border-slate-100 rounded-[32px] overflow-hidden">
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
                  <span class="flex items-center gap-2">📢 {{ comm.category }}</span>
                  <span class="flex items-center gap-2">📅 {{ comm.date | date:'shortDate' }}</span>
                  <span class="flex items-center gap-2">📝 {{ comm.author }}</span>
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

    <!-- Modal Mock -->
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
  
  loading = false;
  activeTab = 'all';
  searchQuery = '';
  priorityFilter = 'all';
  selectedComm: Communication | null = null;

  allComms: Communication[] = [];
  filteredComms: Communication[] = [];

  ngOnInit() {
    this.loadCommunications();
  }

  loadCommunications() {
    this.loading = true;
    setTimeout(() => {
      this.allComms = [
        {
          id: '1',
          title: 'Simulacro de Evacuación Programado',
          content: 'Estimados alumnos,\n\nMañana a las 10:00 AM realizaremos un simulacro de sismo obligatorio. Por favor revisar las rutas de evacuación pegadas en sus aulas y seguir las instrucciones de los brigadistas.\n\nLa seguridad es tarea de todos.',
          date: new Date().toISOString(),
          priority: 'urgente',
          author: 'Dirección Académica',
          category: 'Seguridad',
          read: false
        },
        {
          id: '2',
          title: 'Resultados de las Olimpiadas Matemáticas',
          content: 'Felicitamos a todos los participantes de la fase regional. Los nombres de los clasificados a la etapa nacional ya están publicados en el mural central y en la secretaría del colegio.\n\n¡Mucha suerte en la siguiente fase!',
          date: new Date(Date.now() - 86400000).toISOString(),
          priority: 'media',
          author: 'Dpto. de Matemáticas',
          category: 'Académico',
          read: true
        },
        {
          id: '3',
          title: 'Mantenimiento del Sistema de Red',
          content: 'El acceso a la plataforma virtual estará restringido este sábado desde las 14:00 hasta las 20:00 por trabajos de actualización de servidores. Agradecemos su comprensión.',
          date: new Date(Date.now() - 172800000).toISOString(),
          priority: 'normal',
          author: 'Soporte IT',
          category: 'Tecnología',
          read: false
        },
        {
          id: '4',
          title: 'Cambio en el Horario de Educación Física',
          content: 'A partir de la próxima semana, las clases de Ed. Física para 3ro y 4to de secundaria se trasladarán al complejo deportivo municipal. El bus saldrá de la puerta 2 a las 8:15 AM puntualmente.',
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          priority: 'urgente',
          author: 'Coord. Deportes',
          category: 'Deportes',
          read: true
        }
      ];
      this.filterCommunications();
      this.loading = false;
    }, 1000);
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
}
