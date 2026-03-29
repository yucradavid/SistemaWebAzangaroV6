import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { MessagingService, Announcement } from '@core/services/messaging.service';
import { AcademicService } from '@core/services/academic.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-communications-management',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Gestionar Comunicados</h1>
          <p class="text-slate-500 text-sm font-medium">Administra los avisos y anuncios institucionales</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-red-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Comunicado
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div *ngFor="let kpi of kpis" class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
          <div class="flex items-start justify-between relative z-10">
            <div class="space-y-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{{ kpi.label }}</p>
              <h3 class="text-2xl font-bold text-slate-900 tracking-tighter">{{ kpi.value }}</h3>
            </div>
            <div [class]="'p-3 rounded-xl transition-colors ' + kpi.bgColor">
              <svg class="w-6 h-6" [class]="kpi.iconColor" [innerHTML]="kpi.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
            </div>
          </div>
          <div class="absolute -right-2 -bottom-2 w-16 h-16 bg-slate-50/50 rounded-full blur-2xl group-hover:bg-blue-50/50 transition-all"></div>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-50 bg-slate-50/10 flex items-center gap-2 px-6">
          <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <h2 class="text-sm font-semibold text-slate-700 tracking-tight">Filtros</h2>
        </div>
        <div class="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
            <div class="relative group">
              <select (change)="applyFilters('status', $any($event.target).value)" class="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option value="">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente_aprobacion">Pendiente Aprobación</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
              <svg class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Público (Audiencia)</label>
            <div class="relative group">
              <select (change)="applyFilters('audience', $any($event.target).value)" class="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                <option value="">Todas</option>
                <option value="todos">Todos</option>
                <option value="docentes">Docentes</option>
                <option value="estudiantes">Estudiantes</option>
                <option value="apoderados">Apoderados</option>
                <option value="seccion_especifica">Sección Específica</option>
              </select>
              <svg class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/10 px-8">
          <h2 class="text-base font-bold text-slate-800 tracking-tight uppercase">Mis Comunicados ({{ filteredCommunications.length }})</h2>
        </div>

        <div class="divide-y divide-slate-50">
          <div *ngIf="loading" class="p-8 text-center text-slate-400">Cargando comunicados...</div>
          <div *ngIf="!loading && filteredCommunications.length === 0" class="p-8 text-center text-slate-400">No hay comunicados registrados.</div>

          <div *ngFor="let comm of filteredCommunications" class="p-8 hover:bg-slate-50/50 transition-all group scale-100 active:scale-[0.99]">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div class="space-y-4 flex-1">
                <div class="flex items-center gap-3">
                  <span [class]="'px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight ' + getStatusClass(comm.status)">
                    {{ comm.status.replace('_', ' ') }}
                  </span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors tracking-tight uppercase">{{ comm.title }}</h3>
                  <p class="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium whitespace-pre-line">
                    {{ comm.content }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                  <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{{ getAudienceLabel(comm) }}</div>
                  <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z"/><path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/></svg>{{ getCreatorLabel(comm) }}</div>
                  <div class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>Creado: {{ comm.created_at | date:'dd MMM yyyy' }}</div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  *ngIf="comm.status === 'borrador'"
                  (click)="requestApproval(comm.id)"
                  title="Solicitar Aprobación"
                  class="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all shadow-sm active:scale-95">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </button>
                <button
                  *ngIf="comm.status === 'borrador'"
                  (click)="editAnnouncement(comm)"
                  title="Editar"
                  class="p-3 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-2xl transition-all shadow-sm active:scale-95">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  *ngIf="comm.status === 'publicado'"
                  (click)="archive(comm.id)"
                  title="Archivar"
                  class="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all shadow-sm active:scale-95">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3" rx="1"/><line x1="10" x2="14" y1="12" y2="12"/></svg>
                </button>
                <button
                  (click)="deleteAnnouncement(comm.id)"
                  title="Eliminar"
                  class="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm active:scale-95">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 class="text-xl font-bold text-blue-900">{{ isEditing ? 'Editar' : 'Nuevo' }} Comunicado</h3>
            <button (click)="closeModal()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form [formGroup]="form" (ngSubmit)="saveAnnouncement()" class="p-8 space-y-6">
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Título del Comunicado</label>
                <input formControlName="title" type="text" placeholder="Escribe el título aquí..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Audiencia (Público Objetivo)</label>
                <select formControlName="audience" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium">
                  <option value="todos">Todos en la institución</option>
                  <option value="docentes">Solo Docentes</option>
                  <option value="estudiantes">Solo Estudiantes</option>
                  <option value="apoderados">Solo Apoderados</option>
                  <option value="seccion_especifica">Una Sección Específica</option>
                </select>
              </div>

              <div *ngIf="form.get('audience')?.value === 'seccion_especifica'" class="space-y-2 animate-fade-in">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Seleccionar Sección</label>
                <select formControlName="section_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium">
                  <option value="">Seleccione...</option>
                  <option *ngFor="let sec of sections" [value]="sec.id">{{ getSectionLabel(sec) }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Contenido del Mensaje</label>
                <textarea formControlName="content" rows="6" placeholder="Detalla el contenido del anuncio..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none"></textarea>
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button (click)="closeModal()" type="button" class="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all active:scale-95">
                Cancelar
              </button>
              <button [disabled]="form.invalid || saving" type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <span *ngIf="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar como Borrador') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CommunicationsManagementComponent implements OnInit {
  kpis = [
    { label: 'Total', value: 0, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4"/><path d="M10 17h4"/>' },
    { label: 'Publicados', value: 0, iconColor: 'text-green-500', bgColor: 'bg-green-50', icon: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { label: 'Borradores', value: 0, iconColor: 'text-orange-500', bgColor: 'bg-orange-50', icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
    { label: 'Pendientes', value: 0, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  ];

  communications: Announcement[] = [];
  filteredCommunications: Announcement[] = [];
  sections: any[] = [];
  loading = false;
  saving = false;

  filters = { status: '', audience: '' };

  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  form: FormGroup;

  constructor(
    private messagingService: MessagingService,
    private academicService: AcademicService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      audience: ['todos', Validators.required],
      section_id: ['']
    });

    this.form.get('audience')?.valueChanges.subscribe(value => {
      const sectionControl = this.form.get('section_id');

      if (value === 'seccion_especifica') {
        sectionControl?.setValidators(Validators.required);
      } else {
        sectionControl?.clearValidators();
        sectionControl?.setValue('');
      }

      sectionControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadAnnouncements();
    this.loadSections();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.messagingService.getAnnouncements(this.filters).subscribe({
      next: (response) => {
        this.communications = response.data || [];
        this.filteredCommunications = [...this.communications];
        this.updateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadSections(): void {
    this.academicService.getSections({ per_page: 200 }).subscribe(response => {
      this.sections = response.data || response;
    });
  }

  applyFilters(key: 'status' | 'audience', value: string): void {
    this.filters[key] = value;
    this.loadAnnouncements();
  }

  updateKPIs(): void {
    this.kpis[0].value = this.communications.length;
    this.kpis[1].value = this.communications.filter(comm => comm.status === 'publicado').length;
    this.kpis[2].value = this.communications.filter(comm => comm.status === 'borrador').length;
    this.kpis[3].value = this.communications.filter(comm => comm.status === 'pendiente_aprobacion').length;
  }

  getAudienceLabel(comm: Announcement): string {
    if (comm.audience === 'seccion_especifica') {
      return `Sección: ${this.getSectionLabel(comm.section)}`;
    }

    const labels: Record<string, string> = {
      todos: 'Todos',
      docentes: 'Docentes',
      estudiantes: 'Estudiantes',
      apoderados: 'Apoderados'
    };

    return labels[comm.audience] || comm.audience;
  }

  getSectionLabel(section: any): string {
    if (!section) {
      return 'Sin sección';
    }

    const gradeName = section.grade_level?.name || section.gradeLevel?.name || '';
    const sectionName = section.name || section.section_letter || '';

    if (!gradeName && !sectionName) {
      return 'Sección';
    }

    if (!gradeName) {
      return `Sección ${sectionName}`;
    }

    if (!sectionName) {
      return gradeName;
    }

    return `${gradeName} - Sección ${sectionName}`;
  }

  getCreatorLabel(comm: Announcement): string {
    return comm.creator?.full_name || 'Creado por administración';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      borrador: 'bg-orange-50 text-orange-600',
      pendiente_aprobacion: 'bg-purple-50 text-purple-600',
      publicado: 'bg-green-50 text-green-600',
      archivado: 'bg-slate-100 text-slate-500'
    };

    return map[status] || 'bg-slate-100 text-slate-500';
  }

  openModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({ audience: 'todos' });
    this.showModal = true;
  }

  editAnnouncement(comm: Announcement): void {
    this.isEditing = true;
    this.currentId = comm.id;
    this.form.patchValue({
      title: comm.title,
      content: comm.content,
      audience: comm.audience,
      section_id: comm.section_id || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveAnnouncement(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving = true;

    const request = this.isEditing && this.currentId
      ? this.messagingService.updateAnnouncement(this.currentId, this.form.value)
      : this.messagingService.createAnnouncement(this.form.value);

    request.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? 'Actualizado' : 'Borrador Creado',
          text: 'El comunicado se ha guardado exitosamente.',
          confirmButtonColor: '#1e3a8a',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadAnnouncements();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        Swal.fire('Error', 'No se pudo guardar el comunicado.', 'error');
      }
    });
  }

  requestApproval(id: string): void {
    Swal.fire({
      title: '¿Solicitar Aprobación?',
      text: 'El comunicado pasará a revisión por un administrador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.messagingService.requestApproval(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Enviado',
              text: 'Se ha solicitado aprobación.',
              toast: true,
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false
            });
            this.loadAnnouncements();
          }
        });
      }
    });
  }

  archive(id: string): void {
    this.messagingService.archiveAnnouncement(id).subscribe({
      next: () => this.loadAnnouncements()
    });
  }

  deleteAnnouncement(id: string): void {
    Swal.fire({
      title: '¿Eliminar Comunicado?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.messagingService.deleteAnnouncement(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              toast: true,
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false
            });
            this.loadAnnouncements();
          }
        });
      }
    });
  }
}
