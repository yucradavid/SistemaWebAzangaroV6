//src/app/features/admin/settings/document-types.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { DocumentLevel, DocumentService, DocumentType } from '@core/services/document.service';

interface LevelOption {
  value: DocumentLevel;
  label: string;
  badge: string;
  chip: string;
  accent: string;
}

@Component({
  selector: 'app-document-types',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Tipos de documento</h1>
          <p class="text-slate-500 text-sm font-medium">Catalogo configurable de documentos requeridos para la matricula, por nivel educativo.</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo documento
        </button>
      </div>

      <!-- Botones por nivel -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button *ngFor="let lvl of levels"
                (click)="selectLevel(lvl.value)"
                class="bg-white rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md"
                [ngClass]="selectedLevel === lvl.value ? 'border-slate-300 shadow-sm' : 'border-slate-100'">
          <div class="w-11 h-11 rounded-xl mb-3 flex items-center justify-center text-white" [ngClass]="lvl.badge">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
          </div>
          <h3 class="font-bold text-slate-800 text-base">Documentos para {{ lvl.label }}</h3>
          <p class="text-xs text-slate-400 mt-1">{{ getCountForLevel(lvl.value) }} documentos configurados</p>
        </button>
      </div>

      <!-- Tabla / cards del nivel seleccionado -->
      <div class="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <span class="text-xs font-bold px-3 py-1 rounded-full border" [ngClass]="selectedLevelOption?.chip">
            {{ selectedLevelOption?.label }}
          </span>
          <span class="text-xs font-semibold text-slate-400">{{ filteredDocuments.length }} documento(s)</span>
        </div>

        <div *ngIf="loading" class="flex justify-center p-12">
          <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
        </div>

        <div *ngIf="!loading">
          <!-- Vista tabla (desde sm) -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Documento</th>
                  <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Orden</th>
                  <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Obligatorio</th>
                  <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Estado</th>
                  <th class="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr *ngFor="let doc of filteredDocuments" class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-8 py-5">
                    <div class="text-sm font-bold text-[#0F172A]">{{ doc.name }}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">{{ doc.description || 'Sin descripcion' }}</div>
                  </td>
                  <td class="px-8 py-5 text-center text-sm font-semibold text-slate-500">{{ doc.display_order }}</td>
                  <td class="px-8 py-5 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight"
                      [class]="doc.is_required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'">
                      {{ doc.is_required ? 'Obligatorio' : 'Opcional' }}
                    </span>
                  </td>
                  <td class="px-8 py-5 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight"
                      [class]="doc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                      {{ doc.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-8 py-5">
                    <div class="flex justify-end gap-2">
                      <button (click)="editDocumentType(doc)" class="p-2.5 bg-white text-[#0E3A8A] border-2 border-slate-50 hover:border-[#0E3A8A] rounded-xl transition-all shadow-sm active:scale-95" title="Editar">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button (click)="deleteDocumentType(doc)" class="p-2.5 bg-white text-red-500 border-2 border-slate-50 hover:border-red-500 rounded-xl transition-all shadow-sm active:scale-95" title="Eliminar">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vista cards (movil) -->
          <div class="sm:hidden divide-y divide-slate-50">
            <div *ngFor="let doc of filteredDocuments" class="p-5 space-y-3">
              <div>
                <div class="text-sm font-bold text-[#0F172A]">{{ doc.name }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">{{ doc.description || 'Sin descripcion' }}</div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-semibold text-slate-400">Orden {{ doc.display_order }}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight"
                  [class]="doc.is_required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'">
                  {{ doc.is_required ? 'Obligatorio' : 'Opcional' }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight"
                  [class]="doc.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                  {{ doc.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="flex gap-2">
                <button (click)="editDocumentType(doc)" class="flex-1 py-2 bg-white text-[#0E3A8A] border-2 border-slate-100 rounded-xl text-xs font-bold">Editar</button>
                <button (click)="deleteDocumentType(doc)" class="flex-1 py-2 bg-white text-red-500 border-2 border-slate-100 rounded-xl text-xs font-bold">Eliminar</button>
              </div>
            </div>
          </div>

          <div *ngIf="filteredDocuments.length === 0" class="p-12 text-center">
            <p class="text-slate-400 font-bold uppercase tracking-widest text-center">Sin documentos para este nivel</p>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 class="text-xl font-bold text-[#0F172A]">{{ isEditing ? 'Editar tipo de documento' : 'Nuevo tipo de documento' }}</h3>
          <button (click)="closeModal()" class="p-2 rounded-xl hover:bg-white/80 text-slate-400" [disabled]="saving">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="p-6 sm:p-8 space-y-5">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre del documento</label>
            <input formControlName="name" type="text" placeholder="Ej. Copia de DNI del estudiante" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripcion (opcional)</label>
            <textarea formControlName="description" rows="3" placeholder="Cuando aplica este documento" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nivel educativo</label>
            <select formControlName="level" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              <option *ngFor="let lvl of levels" [value]="lvl.value">{{ lvl.label }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Orden de aparicion</label>
              <input formControlName="display_order" type="number" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
              <select formControlName="is_active" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option [ngValue]="true">Activo</option>
                <option [ngValue]="false">Inactivo</option>
              </select>
            </div>
          </div>

          <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input type="checkbox" formControlName="is_required" class="w-5 h-5 rounded text-blue-600">
            <span class="text-sm font-semibold text-slate-700">Es obligatorio para completar la matricula</span>
          </label>

          <div class="flex gap-4 pt-2">
            <button (click)="closeModal()" type="button" [disabled]="saving" class="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50">
              Cancelar
            </button>
            <button [disabled]="form.invalid || saving" type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class DocumentTypesComponent implements OnInit {
  readonly levels: LevelOption[] = [
    { value: 'inicial', label: 'Inicial', badge: 'bg-gradient-to-br from-amber-500 to-orange-500', chip: 'bg-amber-50 text-amber-700 border-amber-200', accent: 'border-amber-500' },
    { value: 'primaria', label: 'Primaria', badge: 'bg-gradient-to-br from-emerald-600 to-emerald-700', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: 'border-emerald-600' },
    { value: 'secundaria', label: 'Secundaria', badge: 'bg-gradient-to-br from-cermat-blue-900 to-cermat-blue-700', chip: 'bg-cermat-blue-50 text-cermat-blue-800 border-cermat-blue-200', accent: 'border-cermat-blue-700' },
  ];

  documentTypes: DocumentType[] = [];
  selectedLevel: DocumentLevel = 'inicial';
  loading = false;
  saving = false;

  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  form: FormGroup;

  constructor(private documentService: DocumentService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      is_required: [true],
      display_order: [0, [Validators.min(0)]],
      is_active: [true],
      level: ['inicial', Validators.required]
    });
  }

  get selectedLevelOption(): LevelOption | undefined {
    return this.levels.find((lvl) => lvl.value === this.selectedLevel);
  }

  get filteredDocuments(): DocumentType[] {
    return this.documentTypes.filter((doc) => doc.level === this.selectedLevel);
  }

  ngOnInit(): void {
    this.loadDocumentTypes();
  }

  selectLevel(level: DocumentLevel): void {
    this.selectedLevel = level;
  }

  getCountForLevel(level: DocumentLevel): number {
    return this.documentTypes.filter((doc) => doc.level === level).length;
  }

  loadDocumentTypes(): void {
    this.loading = true;

    this.documentService.getDocumentTypes().subscribe({
      next: (response) => {
        this.documentTypes = Array.isArray(response?.data) ? response.data : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los tipos de documento.', 'error');
      }
    });
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({
      name: '',
      description: '',
      is_required: true,
      display_order: this.getCountForLevel(this.selectedLevel),
      is_active: true,
      level: this.selectedLevel
    });
  }

  editDocumentType(doc: DocumentType): void {
    this.showModal = true;
    this.isEditing = true;
    this.currentId = doc.id;
    this.form.patchValue({
      name: doc.name,
      description: doc.description || '',
      is_required: doc.is_required,
      display_order: doc.display_order,
      is_active: doc.is_active,
      level: doc.level
    });
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }
    this.showModal = false;
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const name = String(this.form.get('name')?.value || '').trim();
    if (!name) {
      Swal.fire('Atencion', 'El nombre del documento es obligatorio.', 'warning');
      return;
    }

    const payload = {
      ...this.form.getRawValue(),
      name,
      description: String(this.form.get('description')?.value || '').trim() || null,
      display_order: Number(this.form.get('display_order')?.value || 0)
    };

    this.saving = true;

    const request = this.isEditing && this.currentId
      ? this.documentService.updateDocumentType(this.currentId, payload)
      : this.documentService.createDocumentType(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadDocumentTypes();
        Swal.fire('Guardado', 'El tipo de documento fue guardado correctamente.', 'success');
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo guardar el tipo de documento.', 'error');
      }
    });
  }

  deleteDocumentType(doc: DocumentType): void {
    Swal.fire({
      title: 'Eliminar tipo de documento',
      text: `Se eliminara "${doc.name}" del catalogo de ${this.levels.find((l) => l.value === doc.level)?.label}. Los registros ya marcados para solicitudes tambien se eliminaran.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.documentService.deleteDocumentType(doc.id).subscribe({
        next: () => {
          this.loadDocumentTypes();
          Swal.fire('Eliminado', 'El tipo de documento fue eliminado.', 'success');
        },
        error: (error) => {
          Swal.fire('Error', error?.error?.message || 'No se pudo eliminar el tipo de documento.', 'error');
        }
      });
    });
  }
}
