import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import { AcademicService } from '@core/services/academic.service';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingFilterDropdownComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Generar QR de Estudiantes</h2>
      <p class="text-sm text-slate-500 mb-6">Genera codigos QR permanentes y exporta carnets impresos.</p>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Nivel</label>
            <app-setting-filter-dropdown
              [options]="levelOptions"
              [selectedId]="filter.level"
              placeholder="Todos los niveles"
              (selectionChange)="onLevelChange($event)">
            </app-setting-filter-dropdown>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Grado</label>
            <app-setting-filter-dropdown
              [options]="gradeOptions"
              [selectedId]="filter.gradeLevelId"
              placeholder="Todos los grados"
              (selectionChange)="onGradeChange($event)">
            </app-setting-filter-dropdown>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Seccion</label>
            <app-setting-filter-dropdown
              [options]="sectionOptions"
              [selectedId]="filter.sectionId"
              placeholder="{{ loadingSections ? 'Cargando secciones...' : 'Todas las secciones' }}"
              (selectionChange)="onSectionChange($event)">
            </app-setting-filter-dropdown>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="generateQr()" [disabled]="generating"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
            {{ generating ? 'Generando...' : selectedStudents.length ? 'Generar QR (' + selectedStudents.length + ' seleccionados)' : 'Generar QR Pendientes' }}
          </button>
          <button (click)="exportAllCarnets()" [disabled]="!selectedStudents.length"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
            Exportar Carnets ({{ selectedStudents.length }})
          </button>
        </div>
      </div>

      <!-- Lista de estudiantes -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <input type="checkbox" class="rounded border-slate-300"
              [checked]="allSelected" (change)="toggleAll()" />
            <span class="text-sm font-medium text-slate-600">
              {{ selectedStudents.length }} seleccionados / {{ students.length }} total
            </span>
          </div>
        </div>

        <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando estudiantes...</div>

        <div *ngIf="!loading" class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          <div *ngFor="let s of students" class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
            <input type="checkbox" class="rounded border-slate-300"
              [checked]="isSelected(s)" (change)="toggleStudent(s)" />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-slate-800 truncate">{{ s.full_name }}</div>
              <div class="text-xs text-slate-500">{{ s.student_code }} | {{ s.section?.grade_level?.name }} - {{ s.section?.section_letter }}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span *ngIf="s.attendance_qr_code" class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">QR Activo</span>
              <span *ngIf="!s.attendance_qr_code" class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Sin QR</span>
              <button (click)="viewCarnet(s)" class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">Carnet</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Seccion Regenerar QR -->
      <div class="bg-white rounded-xl border border-amber-200 shadow-sm p-5 mt-6">
        <h3 class="font-bold text-amber-700 mb-2">Regenerar QR (Opcional)</h3>
        <p class="text-xs text-slate-500 mb-4">Solo para carnet perdido/danado/sospecha de fraude. Genera un codigo nuevo y registra el motivo.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs text-slate-500 mb-1">Motivo (obligatorio)</label>
            <input type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              [(ngModel)]="regenerateReason" placeholder="Ej: Carnet perdido, sospecha de fraude..." />
          </div>
          <div class="flex items-end">
            <button (click)="regenerateQr()" [disabled]="!regenerateReason || !selectedStudents.length || regenerating"
              class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50">
              {{ regenerating ? 'Regenerando...' : 'Regenerar Seleccionados' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Carnet -->
      <div *ngIf="showCarnetModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" (click)="showCarnetModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">Carnet de Estudiante</h3>
            <button (click)="showCarnetModal = false" class="text-slate-400 hover:text-slate-600">&times;</button>
          </div>
          <div class="p-4" [innerHTML]="carnetHtml"></div>
          <div class="p-4 border-t border-slate-200 flex justify-end gap-2">
            <button (click)="printCarnet()" class="px-4 py-2 bg-cermat-blue-800 text-white rounded-lg text-sm font-bold hover:bg-cermat-blue-900">Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QrGeneratorComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private academicService = inject(AcademicService);

  loading = true;
  generating = false;
  regenerating = false;
  loadingSections = false;
  students: any[] = [];
  gradeLevels: any[] = [];
  sections: any[] = [];
  selectedStudents: any[] = [];
  filter = { level: '', gradeLevelId: '', sectionId: '' };
  regenerateReason = '';
  showCarnetModal = false;
  carnetHtml = '';

  levelOptions: Array<{ id: string; name: string }> = [
    { id: 'inicial', name: 'Inicial' },
    { id: 'primaria', name: 'Primaria' },
    { id: 'secundaria', name: 'Secundaria' }
  ];
  gradeOptions: Array<{ id: string; name: string }> = [];
  sectionOptions: Array<{ id: string; name: string }> = [];

  get allSelected(): boolean {
    return this.students.length > 0 && this.selectedStudents.length === this.students.length;
  }

  ngOnInit(): void {
    this.academicService.getGradeLevels({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.gradeLevels = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.updateGradeOptions();
      }
    });
    this.loadStudents();
  }

  onLevelChange(level: string): void {
    this.filter.level = level;
    this.filter.gradeLevelId = '';
    this.filter.sectionId = '';
    this.updateGradeOptions();
    this.clearSections();
    this.loadStudents();
  }

  onGradeChange(gradeLevelId: string): void {
    this.filter.gradeLevelId = gradeLevelId;
    this.filter.sectionId = '';
    this.loadSections(gradeLevelId);
    this.loadStudents();
  }

  onSectionChange(sectionId: string): void {
    this.filter.sectionId = sectionId;
    this.loadStudents();
  }

  private updateGradeOptions(): void {
    const filtered = this.filter.level
      ? this.gradeLevels.filter((g: any) => g.level === this.filter.level)
      : this.gradeLevels;
    this.gradeOptions = filtered.map((g: any) => ({ id: g.id, name: g.name }));
  }

  private loadSections(gradeLevelId: string): void {
    if (!gradeLevelId) {
      this.clearSections();
      return;
    }
    this.loadingSections = true;
    this.academicService.getSections({ grade_level_id: gradeLevelId }).subscribe({
      next: (res: any) => {
        this.sections = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.sectionOptions = this.sections.map((s: any) => ({ id: s.id, name: s.section_letter || 'Seccion' }));
        this.loadingSections = false;
      },
      error: () => { this.loadingSections = false; this.clearSections(); }
    });
  }

  private clearSections(): void {
    this.sections = [];
    this.sectionOptions = [];
    this.loadingSections = false;
  }

  loadStudents(): void {
    this.loading = true;
    const params: any = { status: 'active', per_page: 500 };
    if (this.filter.sectionId) params.section_id = this.filter.sectionId;
    else if (this.filter.gradeLevelId) params.grade_level_id = this.filter.gradeLevelId;
    else if (this.filter.level) params.level = this.filter.level;

    this.academicService.getStudents(params).subscribe({
      next: (res: any) => {
        this.students = res.data || [];
        this.loading = false;
        this.selectedStudents = [];
      },
      error: () => { this.loading = false; }
    });
  }

  isSelected(s: any): boolean {
    return this.selectedStudents.some(x => x.id === s.id);
  }

  toggleStudent(s: any): void {
    if (this.isSelected(s)) {
      this.selectedStudents = this.selectedStudents.filter(x => x.id !== s.id);
    } else {
      this.selectedStudents.push(s);
    }
  }

  toggleAll(): void {
    if (this.allSelected) {
      this.selectedStudents = [];
    } else {
      this.selectedStudents = [...this.students];
    }
  }

  generateQr(): void {
    this.generating = true;
    const data: any = {};
    if (this.selectedStudents.length) data.student_ids = this.selectedStudents.map(s => s.id);
    else if (this.filter.sectionId) data.section_id = this.filter.sectionId;
    else if (this.filter.gradeLevelId) data.grade_level_id = this.filter.gradeLevelId;
    else if (this.filter.level) data.level = this.filter.level;
    else data.all = true;

    this.attendanceService.generateStudentQr(data).subscribe({
      next: (res: any) => {
        this.generating = false;
        Swal.fire('QR Generado', res.message || 'QR generado correctamente.', 'success');
        this.loadStudents();
      },
      error: () => { this.generating = false; }
    });
  }

  viewCarnet(s: any): void {
    this.attendanceService.getStudentCarnet(s.id).subscribe({
      next: (res: any) => {
        this.carnetHtml = res.html;
        this.showCarnetModal = true;
      }
    });
  }

  printCarnet(): void {
    const popup = window.open('', '_blank', 'width=400,height=600');
    if (popup) {
      popup.document.write(this.carnetHtml);
      popup.document.close();
      popup.print();
    }
  }

  exportAllCarnets(): void {
    if (!this.selectedStudents.length) return;
    let html = '';
    let done = 0;
    for (const s of this.selectedStudents) {
      this.attendanceService.getStudentCarnet(s.id).subscribe({
        next: (res: any) => {
          html += res.html + '<div style="page-break-after: always;"></div>';
          done++;
          if (done === this.selectedStudents.length) {
            const popup = window.open('', '_blank', 'width=400,height=600');
            if (popup) {
              popup.document.write('<html><head><title>Carnets</title></head><body>' + html + '</body></html>');
              popup.document.close();
              popup.print();
            }
          }
        }
      });
    }
  }

  regenerateQr(): void {
    if (!this.regenerateReason || this.regenerateReason.length < 5) {
      Swal.fire('Error', 'El motivo debe tener al menos 5 caracteres.', 'error');
      return;
    }

    Swal.fire({
      title: 'Regenerar QR',
      html: `Se regenerara el QR de <strong>${this.selectedStudents.length}</strong> estudiantes.<br><br>El codigo anterior dejara de funcionar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      confirmButtonText: 'Si, regenerar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.regenerating = true;
        this.attendanceService.regenerateQr({
          reason: this.regenerateReason,
          student_ids: this.selectedStudents.map(s => s.id),
        }).subscribe({
          next: (res: any) => {
            this.regenerating = false;
            this.regenerateReason = '';
            this.selectedStudents = [];
            Swal.fire('Regenerado', res.message || 'QR regenerados correctamente.', 'success');
            this.loadStudents();
          },
          error: () => { this.regenerating = false; }
        });
      }
    });
  }
}
