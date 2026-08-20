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
  templateUrl: './news-management.component.html',
  styleUrls: ['./news-management.component.css']
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
