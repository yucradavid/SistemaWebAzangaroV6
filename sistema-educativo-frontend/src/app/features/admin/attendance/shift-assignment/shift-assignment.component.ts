import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shift-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <h2 class="text-xl font-bold text-slate-800 mb-1">Asignar Turnos</h2>
      <p class="text-sm text-slate-500 mb-6">Asigna secciones y docentes al turno manana o tarde.</p>

      <div *ngIf="loading" class="text-center py-12 text-slate-400">Cargando...</div>

      <div *ngIf="!loading" class="space-y-8">
        <!-- Secciones -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-700 mb-4">Secciones</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Seccion</th>
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Grado</th>
                  <th class="text-center py-2 px-3 text-slate-500 font-medium">Turno</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of sectionShifts" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="py-2 px-3 font-medium">{{ s.section_letter }}</td>
                  <td class="py-2 px-3 text-slate-600">{{ s.grade_level?.name || '-' }}</td>
                  <td class="py-2 px-3 text-center">
                    <select class="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      [(ngModel)]="s.shift" (ngModelChange)="markSectionDirty()">
                      <option value="">Sin turno</option>
                      <option value="manana">Manana</option>
                      <option value="tarde">Tarde</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Docentes -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-bold text-slate-700 mb-4">Docentes</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left py-2 px-3 text-slate-500 font-medium">Docente</th>
                  <th class="text-center py-2 px-3 text-slate-500 font-medium">Turno</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of teacherShifts" class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="py-2 px-3 font-medium">{{ t.teacher?.first_name }} {{ t.teacher?.last_name }}</td>
                  <td class="py-2 px-3 text-center">
                    <select class="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                      [(ngModel)]="t.shift" (ngModelChange)="markTeacherDirty()">
                      <option value="">Sin turno</option>
                      <option value="manana">Manana</option>
                      <option value="tarde">Tarde</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button *ngIf="sectionsDirty" (click)="saveSections()" [disabled]="saving"
            class="px-5 py-2 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Secciones' }}
          </button>
          <button *ngIf="teachersDirty" (click)="saveTeachers()" [disabled]="saving"
            class="px-5 py-2 bg-cermat-blue-800 text-white rounded-xl font-bold text-sm hover:bg-cermat-blue-900 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Docentes' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ShiftAssignmentComponent implements OnInit {
  private attendanceService = inject(AttendanceService);

  loading = true;
  saving = false;
  sectionShifts: any[] = [];
  teacherShifts: any[] = [];
  sectionsDirty = false;
  teachersDirty = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.attendanceService.getSectionShifts().subscribe({
      next: (res: any) => {
        this.sectionShifts = (res.data || res || []).map((s: any) => ({ ...s }));
        this.attendanceService.getTeacherShifts().subscribe({
          next: (res2: any) => {
            this.teacherShifts = (res2.data || res2 || []).map((t: any) => ({ ...t }));
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  markSectionDirty(): void { this.sectionsDirty = true; }
  markTeacherDirty(): void { this.teachersDirty = true; }

  saveSections(): void {
    this.saving = true;
    const assignments = this.sectionShifts.map(s => ({
      section_id: s.id,
      shift: s.shift || '',
    }));
    this.attendanceService.updateSectionShifts({ assignments }).subscribe({
      next: () => {
        this.saving = false;
        this.sectionsDirty = false;
        Swal.fire('Guardado', 'Turnos de secciones actualizados.', 'success');
      },
      error: () => { this.saving = false; }
    });
  }

  saveTeachers(): void {
    this.saving = true;
    const assignments = this.teacherShifts
      .filter(t => t.teacher_id)
      .map(t => ({
        teacher_id: t.teacher_id,
        shift: t.shift || '',
      }));
    this.attendanceService.updateTeacherShifts({ assignments }).subscribe({
      next: () => {
        this.saving = false;
        this.teachersDirty = false;
        Swal.fire('Guardado', 'Turnos de docentes actualizados.', 'success');
      },
      error: () => { this.saving = false; }
    });
  }
}
