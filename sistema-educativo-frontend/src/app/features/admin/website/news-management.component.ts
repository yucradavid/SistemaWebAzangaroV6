// src/app/features/website/news-management/news-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { NewsService, NewsItem, NewsResponse } from '@core/services/news.service';

interface FormData {
  title: string;
  excerpt: string;
  category: 'institucional' | 'academico' | 'eventos' | 'comunicados';
  status: 'borrador' | 'publicado' | 'archivado';
  author: string;
  image_url: string;
  is_featured: boolean;
}

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-screen bg-[#F0F4FF] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <app-back-button></app-back-button>

      <!-- ══════════════════════════════════════════
           HEADER
      ══════════════════════════════════════════ -->
      <div class="flex flex-col xl:flex-row xl:items-end gap-6 pb-8 border-b-2 border-[#1A3FA8]/10">
        <div>
          <p class="text-[11px] font-bold tracking-[0.25em] text-[#1A3FA8]/50 uppercase mb-1">CERMAT SCHOOL</p>
          <h1 class="text-4xl font-black text-[#0A1A4E] tracking-tight leading-none">Módulo de Noticias</h1>
        </div>

        <!-- Stats -->
        <div class="flex flex-wrap gap-3 xl:ml-auto">
          <div *ngFor="let stat of stats"
               class="bg-white border border-[#1A3FA8]/10 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm min-w-[130px]">
            <div [class]="'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + stat.bg">
              <span [innerHTML]="stat.icon" class="block w-4 h-4"></span>
            </div>
            <div>
              <span class="text-2xl font-black text-[#0A1A4E] leading-none block">
                {{ loading ? '—' : stat.value }}
              </span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           TOOLBAR
      ══════════════════════════════════════════ -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <!-- Search -->
        <div class="relative w-full sm:w-72">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Buscar noticia..."
            class="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] placeholder-slate-300 focus:border-[#1A3FA8] focus:outline-none shadow-sm transition-all"
          >
        </div>

        <!-- Filters + New -->
        <div class="flex flex-wrap gap-3 items-center">
          <!-- Category -->
          <select
            [(ngModel)]="filterCategory"
            (ngModelChange)="onFilterChange()"
            class="pl-4 pr-8 py-2.5 bg-white border-2 border-transparent rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 focus:border-[#1A3FA8] focus:outline-none appearance-none cursor-pointer shadow-sm transition-all">
            <option value="">Todas las categorías</option>
            <option value="institucional">Institucional</option>
            <option value="academico">Académico</option>
            <option value="eventos">Eventos</option>
            <option value="comunicados">Comunicados</option>
          </select>

          <!-- Status -->
          <select
            [(ngModel)]="filterStatus"
            (ngModelChange)="onFilterChange()"
            class="pl-4 pr-8 py-2.5 bg-white border-2 border-transparent rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 focus:border-[#1A3FA8] focus:outline-none appearance-none cursor-pointer shadow-sm transition-all">
            <option value="">Todos los estados</option>
            <option value="publicado">Publicado</option>
            <option value="borrador">Borrador</option>
            <option value="archivado">Archivado</option>
          </select>

          <!-- New Button -->
          <button
            (click)="openCreateModal()"
            class="px-5 py-2.5 bg-[#1A3FA8] hover:bg-[#0A2A8A] text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Noticia
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           ERROR STATE
      ══════════════════════════════════════════ -->
      <div *ngIf="error"
           class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-700">
        <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p class="font-bold text-sm">Error al cargar las noticias</p>
          <p class="text-xs text-red-500">{{ error }}</p>
        </div>
        <button (click)="loadNews()" class="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-bold transition-all">
          Reintentar
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           LOADING SKELETON
      ══════════════════════════════════════════ -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let i of [1,2,3,4,5,6]"
             class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
          <div class="h-48 bg-slate-100"></div>
          <div class="p-6 space-y-3">
            <div class="h-3 bg-slate-100 rounded w-1/3"></div>
            <div class="h-5 bg-slate-100 rounded w-4/5"></div>
            <div class="h-3 bg-slate-100 rounded w-full"></div>
            <div class="h-3 bg-slate-100 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           EMPTY STATE
      ══════════════════════════════════════════ -->
      <div *ngIf="!loading && !error && news.length === 0"
           class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-3xl bg-[#1A3FA8]/5 flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-[#1A3FA8]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          </svg>
        </div>
        <h3 class="text-xl font-black text-[#0A1A4E] mb-2">No hay noticias</h3>
        <p class="text-sm text-slate-400 mb-6">
          {{ searchQuery || filterCategory || filterStatus ? 'No se encontraron resultados para los filtros aplicados.' : 'Aún no hay noticias creadas.' }}
        </p>
        <button *ngIf="searchQuery || filterCategory || filterStatus"
                (click)="clearFilters()"
                class="px-5 py-2 bg-white border-2 border-[#1A3FA8]/20 rounded-xl text-sm font-bold text-[#1A3FA8] hover:bg-[#1A3FA8]/5 transition-all">
          Limpiar filtros
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           NEWS GRID
      ══════════════════════════════════════════ -->
      <div *ngIf="!loading && !error && news.length > 0"
           class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let item of news"
          class="group bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#1A3FA8]/20 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">

          <!-- Image -->
          <div class="relative h-48 overflow-hidden bg-[#F0F4FF]">
            <img *ngIf="item.imageUrl; else noImg"
                 [src]="item.imageUrl"
                 [alt]="item.title"
                 class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <ng-template #noImg>
              <div class="w-full h-full flex items-center justify-center">
                <svg class="w-14 h-14 text-[#1A3FA8]/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            </ng-template>

            <!-- Status badge -->
            <div class="absolute top-3 right-3">
              <span [class]="'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ' + getStatusClass(item.status)">
                {{ item.status }}
              </span>
            </div>

            <!-- Featured star -->
            <div *ngIf="item.featured"
                 class="absolute top-3 left-3 w-7 h-7 bg-[#FFC107] rounded-lg flex items-center justify-center shadow-md">
              <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="p-5 flex flex-col flex-1">
            <span [class]="'self-start px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 ' + getCategoryClass(item.category)">
              {{ item.category }}
            </span>

            <h3 class="text-base font-black text-[#0A1A4E] leading-snug tracking-tight line-clamp-2 mb-2 group-hover:text-[#1A3FA8] transition-colors">
              {{ item.title }}
            </h3>

            <p class="text-xs text-slate-400 font-medium line-clamp-2 flex-1 mb-4 leading-relaxed">
              {{ item.excerpt }}
            </p>

            <!-- Footer -->
            <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] font-bold text-slate-500">{{ item.author }}</span>
                <span class="text-[10px] text-slate-300">{{ formatDate(item.date || item.createdAt) }}</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  (click)="openEditModal(item)"
                  class="p-2 bg-[#1A3FA8]/5 text-[#1A3FA8] hover:bg-[#1A3FA8] hover:text-white rounded-lg transition-all active:scale-95"
                  title="Editar">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  *ngIf="item.status !== 'publicado'"
                  (click)="publishNews(item)"
                  class="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all active:scale-95"
                  title="Publicar">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
                  </svg>
                </button>
                <button
                  (click)="confirmDelete(item)"
                  class="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all active:scale-95"
                  title="Eliminar">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           PAGINATION
      ══════════════════════════════════════════ -->
      <div *ngIf="meta && meta.last_page > 1"
           class="flex items-center justify-between pt-4">
        <p class="text-xs text-slate-400 font-semibold">
          Mostrando {{ meta.from }}–{{ meta.to }} de {{ meta.total }} noticias
        </p>
        <div class="flex gap-2">
          <button
            [disabled]="currentPage === 1"
            (click)="changePage(currentPage - 1)"
            class="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:border-[#1A3FA8] hover:text-[#1A3FA8] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            ← Anterior
          </button>
          <button
            *ngFor="let p of pageNumbers"
            (click)="changePage(p)"
            [class]="'w-9 h-9 rounded-xl text-xs font-black transition-all ' +
              (p === currentPage ? 'bg-[#1A3FA8] text-white shadow-md' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-[#1A3FA8] hover:text-[#1A3FA8]')">
            {{ p }}
          </button>
          <button
            [disabled]="currentPage === meta.last_page"
            (click)="changePage(currentPage + 1)"
            class="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:border-[#1A3FA8] hover:text-[#1A3FA8] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Siguiente →
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           MODAL CREATE/EDIT
      ══════════════════════════════════════════ -->
      <div *ngIf="showModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1A4E]/60 backdrop-blur-sm"
           (click)="closeModal()">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
             (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="bg-[#1A3FA8] px-8 py-6 flex items-center justify-between">
            <h2 class="text-lg font-black text-white tracking-tight">
              {{ editingNews ? 'Editar Noticia' : 'Nueva Noticia' }}
            </h2>
            <button (click)="closeModal()" class="text-white/60 hover:text-white transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
            <!-- Title -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Título *</label>
              <input
                [(ngModel)]="form.title"
                type="text"
                placeholder="Título de la noticia"
                class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:bg-white focus:outline-none transition-all">
            </div>

            <!-- Excerpt -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Resumen *</label>
              <textarea
                [(ngModel)]="form.excerpt"
                rows="3"
                placeholder="Breve descripción de la noticia"
                class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:bg-white focus:outline-none transition-all resize-none">
              </textarea>
            </div>

            <!-- Category + Status row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Categoría</label>
                <select
                  [(ngModel)]="form.category"
                  class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:outline-none transition-all">
                  <option value="institucional">Institucional</option>
                  <option value="academico">Académico</option>
                  <option value="eventos">Eventos</option>
                  <option value="comunicados">Comunicados</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Estado</label>
                <select
                  [(ngModel)]="form.status"
                  class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:outline-none transition-all">
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>

            <!-- Author -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Autor</label>
              <input
                [(ngModel)]="form.author"
                type="text"
                placeholder="Nombre del autor"
                class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:bg-white focus:outline-none transition-all">
            </div>

            <!-- Image URL -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">URL de imagen</label>
              <input
                [(ngModel)]="form.image_url"
                type="url"
                placeholder="https://..."
                class="w-full px-4 py-2.5 bg-[#F0F4FF] border-2 border-transparent rounded-xl text-sm font-semibold text-[#0A1A4E] focus:border-[#1A3FA8] focus:bg-white focus:outline-none transition-all">
            </div>

            <!-- Featured toggle -->
            <div class="flex items-center gap-3">
              <button
                (click)="form.is_featured = !form.is_featured"
                [class]="'w-11 h-6 rounded-full transition-all relative ' + (form.is_featured ? 'bg-[#FFC107]' : 'bg-slate-200')">
                <span [class]="'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ' + (form.is_featured ? 'left-6' : 'left-1')"></span>
              </button>
              <span class="text-sm font-bold text-slate-600">Marcar como destacada</span>
            </div>

            <!-- Form error -->
            <p *ngIf="formError" class="text-xs text-red-500 font-semibold bg-red-50 px-3 py-2 rounded-lg">
              {{ formError }}
            </p>
          </div>

          <!-- Modal Footer -->
          <div class="px-8 py-5 bg-slate-50 flex gap-3 justify-end">
            <button
              (click)="closeModal()"
              class="px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 transition-all">
              Cancelar
            </button>
            <button
              (click)="submitForm()"
              [disabled]="saving"
              class="px-6 py-2.5 bg-[#1A3FA8] hover:bg-[#0A2A8A] disabled:opacity-60 text-white text-sm font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
              <svg *ngIf="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ saving ? 'Guardando...' : (editingNews ? 'Actualizar' : 'Crear Noticia') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════
           CONFIRM DELETE MODAL
      ══════════════════════════════════════════ -->
      <div *ngIf="showDeleteConfirm"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1A4E]/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </div>
          <h3 class="text-xl font-black text-[#0A1A4E] mb-2">¿Eliminar noticia?</h3>
          <p class="text-sm text-slate-400 mb-6 line-clamp-2">
            "{{ deletingNews?.title }}"
          </p>
          <div class="flex gap-3">
            <button
              (click)="showDeleteConfirm = false; deletingNews = null"
              class="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button
              (click)="deleteNews()"
              [disabled]="saving"
              class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all disabled:opacity-60">
              {{ saving ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 0.8s linear infinite; }
    .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `]
})
export class NewsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // State
  news: NewsItem[] = [];
  loading = false;
  error: string | null = null;
  saving = false;

  // Filters & pagination
  searchQuery = '';
  filterCategory = '';
  filterStatus = '';
  currentPage = 1;
  meta: NewsResponse['meta'] | null = null;

  // Modal
  showModal = false;
  editingNews: NewsItem | null = null;
  form: FormData = this.emptyForm();
  formError: string | null = null;

  // Delete confirm
  showDeleteConfirm = false;
  deletingNews: NewsItem | null = null;

  // Stats (computed from meta + data)
  get stats() {
    const total = this.meta?.total ?? this.news.length;
    const published = this.news.filter(n => n.status === 'publicado').length;
    const drafts = this.news.filter(n => n.status === 'borrador').length;
    const featured = this.news.filter(n => n.featured).length;
    return [
      { label: 'Total', value: total, bg: 'bg-[#1A3FA8]/10 text-[#1A3FA8]', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' },
      { label: 'Publicadas', value: published, bg: 'bg-green-50 text-green-600', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' },
      { label: 'Borradores', value: drafts, bg: 'bg-slate-100 text-slate-500', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
      { label: 'Destacadas', value: featured, bg: 'bg-yellow-50 text-yellow-600', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
    ];
  }

  get pageNumbers(): number[] {
    if (!this.meta) return [];
    const pages: number[] = [];
    for (let i = 1; i <= this.meta.last_page; i++) {
      if (i === 1 || i === this.meta.last_page || Math.abs(i - this.currentPage) <= 1) {
        pages.push(i);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadNews();
    });

    this.loadNews();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNews() {
    this.loading = true;
    this.error = null;

    this.newsService.getAllNews({
      page: this.currentPage,
      per_page: 9,
      status: this.filterStatus || undefined,
      category: this.filterCategory || undefined,
      q: this.searchQuery || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.news = res.data;
        this.meta = res.meta ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo conectar con el servidor.';
        this.loading = false;
      }
    });
  }

  onSearchChange(val: string) {
    this.searchSubject.next(val);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadNews();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.onFilterChange();
  }

  changePage(page: number) {
    if (page < 1 || (this.meta && page > this.meta.last_page)) return;
    this.currentPage = page;
    this.loadNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── MODAL ──────────────────────────────────────────

  openCreateModal() {
    this.editingNews = null;
    this.form = this.emptyForm();
    this.formError = null;
    this.showModal = true;
  }

  openEditModal(item: NewsItem) {
    this.editingNews = item;
    this.form = {
      title: item.title,
      excerpt: item.excerpt,
      category: item.category,
      status: item.status,
      author: item.author,
      image_url: item.imageUrl ?? '',
      is_featured: item.featured,
    };
    this.formError = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingNews = null;
    this.formError = null;
  }

  submitForm() {
    if (!this.form.title.trim() || !this.form.excerpt.trim()) {
      this.formError = 'El título y el resumen son obligatorios.';
      return;
    }

    this.saving = true;
    this.formError = null;

    const payload = {
      title: this.form.title,
      excerpt: this.form.excerpt,
      category: this.form.category,
      status: this.form.status,
      author: this.form.author,
      image_url: this.form.image_url || undefined,
      is_featured: this.form.is_featured,
    };

    const request$ = this.editingNews
      ? this.newsService.updateNews(this.editingNews.id, payload)
      : this.newsService.createNews(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadNews();
      },
      error: (err) => {
        this.formError = err?.error?.message ?? 'Error al guardar la noticia.';
        this.saving = false;
      }
    });
  }

  // ── DELETE ──────────────────────────────────────────

  confirmDelete(item: NewsItem) {
    this.deletingNews = item;
    this.showDeleteConfirm = true;
  }

  deleteNews() {
    if (!this.deletingNews) return;
    this.saving = true;

    this.newsService.deleteNews(this.deletingNews.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.showDeleteConfirm = false;
        this.deletingNews = null;
        this.loadNews();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Error al eliminar.';
        this.showDeleteConfirm = false;
      }
    });
  }

  // ── QUICK PUBLISH ──────────────────────────────────

  publishNews(item: NewsItem) {
    this.newsService.updateNews(item.id, { status: 'publicado' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.loadNews() });
  }

  // ── HELPERS ─────────────────────────────────────────

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      'publicado': 'bg-green-100 text-green-700',
      'borrador': 'bg-slate-100 text-slate-500',
      'archivado': 'bg-red-100 text-red-500',
    };
    return map[status] ?? 'bg-slate-100 text-slate-400';
  }

  getCategoryClass(category: string) {
    const map: Record<string, string> = {
      'institucional': 'bg-[#1A3FA8]/10 text-[#1A3FA8]',
      'academico': 'bg-purple-100 text-purple-600',
      'eventos': 'bg-pink-100 text-pink-600',
      'comunicados': 'bg-amber-100 text-amber-600',
    };
    return map[category] ?? 'bg-slate-100 text-slate-400';
  }

  private emptyForm(): FormData {
    return {
      title: '',
      excerpt: '',
      category: 'institucional',
      status: 'borrador',
      author: '',
      image_url: '',
      is_featured: false,
    };
  }
}
