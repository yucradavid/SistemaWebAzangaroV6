import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SitePageCover, SitePageCoverService } from '@core/services/site-page-cover.service';

const PAGE_LABELS: Record<string, string> = {
  'home': 'Inicio',
  'admision': 'Admisión',
  'niveles-inicial': 'Nivel Inicial',
  'niveles-primaria': 'Nivel Primaria',
  'niveles-secundaria': 'Nivel Secundaria',
  'docentes': 'Plana Docente',
  'noticias': 'Noticias y Eventos',
  'transparencia': 'Transparencia',
  'contacto': 'Contacto',
};

/** Posiciones guardadas antes del point-picker (texto CSS clásico) -> % equivalente. */
const LEGACY_POSITIONS: Record<string, { x: number; y: number }> = {
  'center center': { x: 50, y: 50 },
  'top center': { x: 50, y: 0 },
  'bottom center': { x: 50, y: 100 },
  'left center': { x: 0, y: 50 },
  'right center': { x: 100, y: 50 },
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface CoverRow extends SitePageCover {
  label: string;
  localPreview: string | null;
  uploading: boolean;
  savingPosition: boolean;
  dragging: boolean;
}

@Component({
  selector: 'app-page-covers',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <app-back-button></app-back-button>

      <div class="pb-8 border-b-2 border-cermat-blue-100">
        <p class="text-[11px] font-bold tracking-[0.25em] text-cermat-blue-600/60 uppercase mb-1">CERMAT SCHOOL</p>
        <h1 class="text-4xl font-black text-cermat-blue-900 tracking-tight leading-none">Portadas del Sitio Público</h1>
        <p class="text-sm font-medium text-slate-400 mt-2">Configura la imagen de portada de cada página pública. Si no subes una imagen, se muestra el fondo por defecto.</p>
      </div>

      <div *ngIf="error" class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-700">
        <p class="font-bold text-sm">{{ error }}</p>
        <button (click)="loadCovers()" class="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-bold transition-all">Reintentar</button>
      </div>

      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
          <div class="h-40 bg-slate-100"></div>
          <div class="p-5 space-y-3">
            <div class="h-4 bg-slate-100 rounded w-2/3"></div>
            <div class="h-8 bg-slate-100 rounded w-full"></div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let cover of covers; trackBy: trackByKey"
             class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">

          <!-- Header: título + badge de estado -->
          <div class="px-5 pt-5 flex items-center justify-between gap-2">
            <h3 class="font-bold text-lg text-cermat-blue-700 tracking-tight truncate">{{ cover.label }}</h3>
            <span *ngIf="cover.urls" class="flex-shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Configurada</span>
            <span *ngIf="!cover.urls" class="flex-shrink-0 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">Sin imagen</span>
          </div>

          <div class="p-5 flex flex-col gap-2 flex-1">

            <!-- Preview grande + point-picker arrastrable (mouse y touch) -->
            <div *ngIf="cover.urls || cover.localPreview; else noImagePlaceholder"
                 class="relative w-full aspect-[3/1] rounded-xl overflow-hidden border-2 border-cermat-blue-100 touch-none select-none cursor-crosshair"
                 (mousedown)="startDrag($event, cover)"
                 (touchstart)="startDrag($event, cover)">

              <img [src]="cover.localPreview || cover.urls?.medium"
                   [alt]="cover.alt_text || cover.label"
                   [style.object-position]="cover.object_position"
                   class="w-full h-full object-cover pointer-events-none">

              <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

              <div class="absolute w-6 h-6 rounded-full bg-white border-[3px] border-cermat-blue-600 shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
                   [class.scale-125]="cover.dragging"
                   [style.left.%]="focusPointOf(cover).x"
                   [style.top.%]="focusPointOf(cover).y">
                <div class="absolute inset-0 rounded-full bg-cermat-blue-600/30 animate-ping" *ngIf="cover.dragging"></div>
              </div>

              <div *ngIf="cover.uploading" class="absolute inset-0 bg-cermat-blue-950/60 flex items-center justify-center">
                <svg class="w-8 h-8 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>

              <div *ngIf="cover.savingPosition" class="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-[10px] font-bold text-cermat-blue-700 flex items-center gap-1.5 shadow-sm">
                <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Guardando…
              </div>
            </div>

            <ng-template #noImagePlaceholder>
              <div class="w-full aspect-[3/1] rounded-xl bg-cermat-blue-50 border-2 border-cermat-blue-100 flex flex-col items-center justify-center gap-2 text-cermat-blue-200">
                <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span class="text-[10px] font-bold uppercase tracking-widest">Sin imagen</span>
              </div>
            </ng-template>

            <div *ngIf="cover.urls || cover.localPreview">
              <p class="text-sm font-semibold text-slate-600 mt-2 mb-1">Punto de enfoque</p>
              <p class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
                Toca o arrastra sobre la imagen para elegir el punto de enfoque
              </p>
            </div>

            <!-- Preview dual: desktop vs móvil, se actualiza en vivo mientras se arrastra -->
            <div *ngIf="cover.urls || cover.localPreview" class="grid grid-cols-2 gap-2 mt-1">
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 text-center">Vista Desktop</p>
                <div class="relative w-full aspect-[3/1] bg-slate-100 rounded-lg overflow-hidden">
                  <img [src]="cover.localPreview || cover.urls?.medium"
                       [alt]="cover.alt_text || cover.label"
                       [style.object-position]="cover.object_position"
                       class="w-full h-full object-cover">
                </div>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 text-center">Vista Móvil</p>
                <div class="relative w-full aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
                  <img [src]="cover.localPreview || cover.urls?.medium"
                       [alt]="cover.alt_text || cover.label"
                       [style.object-position]="cover.object_position"
                       class="w-full h-full object-cover">
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-auto pt-3">
              <label class="flex-1 px-4 py-2.5 bg-cermat-blue-700 hover:bg-cermat-blue-800 text-white text-xs font-bold uppercase tracking-wide rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                Cambiar imagen
                <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event, cover)">
              </label>
              <button *ngIf="cover.urls"
                      (click)="removeCover(cover)"
                      [disabled]="cover.uploading"
                      class="px-3 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95 disabled:opacity-40"
                      title="Quitar imagen">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
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
export class PageCoversComponent implements OnInit {
  covers: CoverRow[] = [];
  loading = false;
  error: string | null = null;

  constructor(private coverService: SitePageCoverService) {}

  ngOnInit(): void {
    this.loadCovers();
  }

  loadCovers(): void {
    this.loading = true;
    this.error = null;

    this.coverService.getCovers().subscribe({
      next: (res) => {
        this.covers = res.data.map(c => ({
          ...c,
          label: PAGE_LABELS[c.page_key] ?? c.page_key,
          localPreview: null,
          uploading: false,
          savingPosition: false,
          dragging: false,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudieron cargar las portadas.';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event, cover: CoverRow): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      Swal.fire('Formato no válido', 'Solo se aceptan imágenes JPG, PNG o WebP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      Swal.fire('Archivo muy grande', 'El tamaño máximo permitido es 8MB.', 'error');
      input.value = '';
      return;
    }

    if (cover.localPreview) {
      URL.revokeObjectURL(cover.localPreview);
    }
    cover.localPreview = URL.createObjectURL(file);
    cover.uploading = true;

    this.coverService.uploadCover(cover.page_key, file, cover.alt_text ?? undefined, cover.object_position).subscribe({
      next: (res) => {
        Object.assign(cover, res.data);
        cover.uploading = false;
        if (cover.localPreview) {
          URL.revokeObjectURL(cover.localPreview);
          cover.localPreview = null;
        }
        input.value = '';
        Swal.fire({
          icon: 'success',
          title: 'Portada actualizada',
          toast: true,
          position: 'top-end',
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        cover.uploading = false;
        if (cover.localPreview) {
          URL.revokeObjectURL(cover.localPreview);
          cover.localPreview = null;
        }
        input.value = '';
        Swal.fire(
          'No se pudo subir la imagen',
          err?.error?.message ?? 'Ocurrió un error inesperado. Verifica que el archivo sea JPG, PNG o WebP válido y pese menos de 8MB.',
          'error'
        );
      }
    });
  }

  removeCover(cover: CoverRow): void {
    Swal.fire({
      title: '¿Quitar imagen?',
      text: `La página "${cover.label}" volverá al fondo por defecto.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1d4ed8',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      cover.uploading = true;
      this.coverService.deleteCover(cover.page_key).subscribe({
        next: (res) => {
          Object.assign(cover, res.data);
          cover.uploading = false;
          Swal.fire({
            icon: 'success',
            title: 'Imagen eliminada',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          cover.uploading = false;
          Swal.fire('Error', err?.error?.message ?? 'No se pudo quitar la imagen.', 'error');
        }
      });
    });
  }

  trackByKey(_: number, cover: CoverRow): string {
    return cover.page_key;
  }

  // ── Point-picker: drag/touch para elegir el punto de enfoque ──────────

  startDrag(event: MouseEvent | TouchEvent, cover: CoverRow): void {
    event.preventDefault();
    const pickerEl = event.currentTarget as HTMLElement;

    cover.dragging = true;
    this.updateFocusPoint(event, cover, pickerEl);

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      this.updateFocusPoint(e, cover, pickerEl);
    };

    const endHandler = () => {
      cover.dragging = false;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
      this.savePosition(cover);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }

  /**
   * pickerEl se captura una sola vez al iniciar el drag (en startDrag) y se reutiliza
   * aquí: dentro de moveHandler, event.currentTarget sería `document` (donde está el
   * listener), no el picker, así que no sirve para recalcular el rect en cada movimiento.
   */
  private updateFocusPoint(event: MouseEvent | TouchEvent, cover: CoverRow, pickerEl: HTMLElement): void {
    const rect = pickerEl.getBoundingClientRect();
    const point = 'touches' in event ? event.touches[0] : event;
    if (!point) return;

    let x = ((point.clientX - rect.left) / rect.width) * 100;
    let y = ((point.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    cover.object_position = `${Math.round(x)}% ${Math.round(y)}%`;
  }

  savePosition(cover: CoverRow): void {
    cover.savingPosition = true;

    this.coverService.updatePosition(cover.page_key, cover.object_position).subscribe({
      next: (res) => {
        Object.assign(cover, res.data);
        cover.savingPosition = false;
      },
      error: (err) => {
        cover.savingPosition = false;
        Swal.fire('Error', err?.error?.message ?? 'No se pudo guardar la posición.', 'error');
      }
    });
  }

  /** Traduce object_position (formato viejo "top center" o nuevo "42% 67%") a coordenadas %. */
  focusPointOf(cover: CoverRow): { x: number; y: number } {
    const percentMatch = cover.object_position?.match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
    if (percentMatch) {
      return { x: parseFloat(percentMatch[1]), y: parseFloat(percentMatch[2]) };
    }

    return LEGACY_POSITIONS[cover.object_position] ?? { x: 50, y: 50 };
  }
}
