import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import {
  Assignment,
  AssignmentMetrics,
  AssignmentSubmissionSummaryRow,
  TaskService,
  TaskSubmission,
} from '@core/services/task.service';
import { AcademicService, Course } from '@core/services/academic.service';

@Component({
  selector: 'app-task-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <app-back-button></app-back-button>

      <div>
        <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Calificar Entregas</h1>
        <p class="text-slate-500 text-sm mt-1 font-medium">Revisa entregas, pendientes y estudiantes sin envio.</p>
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso</label>
          <select
            [(ngModel)]="selectedCourseId"
            (ngModelChange)="onCourseChange()"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Todos los cursos</option>
            <option *ngFor="let course of courses" [value]="course.id">{{ course.name }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarea</label>
          <select
            [(ngModel)]="selectedAssignmentId"
            (ngModelChange)="loadSubmissions()"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Todas las tareas</option>
            <option *ngFor="let assignment of assignments" [value]="assignment.id">{{ assignment.title }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</label>
          <select
            [(ngModel)]="selectedStatus"
            (ngModelChange)="loadSubmissions()"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">Todos los estados</option>
            <option value="submitted">Entregado</option>
            <option value="graded">Calificado</option>
            <option value="missing">Sin entrega</option>
          </select>
        </div>
      </div>

      <section *ngIf="selectedAssignment" class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tarea seleccionada</p>
            <h2 class="mt-2 text-xl font-black text-slate-900">{{ selectedAssignment.title }}</h2>
            <p class="mt-1 text-sm font-medium text-slate-500">
              {{ selectedAssignment.course?.name || 'Curso' }} |
              {{ selectedAssignment.section?.section_letter ? 'Seccion ' + selectedAssignment.section?.section_letter : 'Seccion' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-2 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black uppercase tracking-widest">
              Esperados {{ metrics()?.expected_count ?? 0 }}
            </span>
            <span class="px-3 py-2 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-black uppercase tracking-widest">
              Entregados {{ metrics()?.submitted_count ?? 0 }}
            </span>
            <span class="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-widest">
              Sin calificar {{ metrics()?.pending_count ?? 0 }}
            </span>
            <span class="px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-widest">
              Sin entregar {{ metrics()?.missing_count ?? 0 }}
            </span>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-b-4 border-b-blue-900">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Registros</p>
          <h3 class="text-3xl font-black text-slate-900 tracking-tighter">{{ rows().length }}</h3>
        </div>
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-b-4 border-b-green-500">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Entregadas</p>
          <h3 class="text-3xl font-black text-slate-900 tracking-tighter">{{ submittedCount() }}</h3>
        </div>
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-b-4 border-b-amber-500">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Calificadas</p>
          <h3 class="text-3xl font-black text-slate-900 tracking-tighter">{{ gradedCount() }}</h3>
        </div>
        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-b-4 border-b-rose-500">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sin entrega</p>
          <h3 class="text-3xl font-black text-slate-900 tracking-tighter">{{ missingCount() }}</h3>
        </div>
      </div>

      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
        {{ error() }}
      </div>

      <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800 tracking-tight">Lista de Entregas</h2>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ rows().length }} registros</span>
        </div>

        <div *ngIf="!loading() && rows().length === 0" class="py-20 text-center">
          <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg class="w-10 h-10 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h3 class="text-slate-700 font-semibold text-lg">No hay registros disponibles</h3>
          <p class="text-slate-400 text-sm mt-1.5 font-medium max-w-xs mx-auto">Selecciona un curso o una tarea para revisar entregas y faltantes.</p>
        </div>

        <div *ngIf="!loading() && rows().length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th class="text-left py-4 px-6">Estudiante</th>
                <th class="text-left py-4 px-6">Tarea</th>
                <th class="text-left py-4 px-6">Curso</th>
                <th class="text-center py-4 px-6">Fecha Entrega</th>
                <th class="text-center py-4 px-6">Estado</th>
                <th class="text-center py-4 px-6">Calificacion</th>
                <th class="text-right py-4 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let row of rows()" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-black text-sm uppercase">
                      {{ getInitials(row) }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800">{{ getStudentName(row) }}</p>
                      <p class="text-[10px] text-slate-400 font-bold">{{ row.student.student_code || 'N/D' }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6 text-sm font-medium text-slate-600">{{ getAssignmentTitle(row) }}</td>
                <td class="py-4 px-6 text-sm font-medium text-slate-500">{{ getCourseName(row) }}</td>
                <td class="py-4 px-6 text-center text-sm text-slate-500">
                  {{ row.submission?.submission_date ? (row.submission?.submission_date | date:'dd/MM/yyyy HH:mm') : '-' }}
                </td>
                <td class="py-4 px-6 text-center">
                  <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight" [class]="getStatusClass(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </span>
                </td>
                <td class="py-4 px-6 text-center">
                  <span *ngIf="row.submission?.status === 'graded'" class="text-sm font-black text-blue-900">
                    {{ row.submission?.grade ?? '-' }}{{ row.submission?.grade_letter ? ' / ' + row.submission?.grade_letter : '' }}
                  </span>
                  <span *ngIf="row.submission?.status !== 'graded'" class="text-slate-300 font-bold text-sm">-</span>
                </td>
                <td class="py-4 px-6 text-right">
                  <button
                    *ngIf="row.submission"
                    (click)="openGradeModal(row.submission)"
                    class="px-4 py-2 bg-blue-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-800 transition-all active:scale-95 shadow-sm"
                  >
                    {{ row.submission.status === 'graded' ? 'Actualizar' : 'Calificar' }}
                  </button>
                  <span *ngIf="!row.submission" class="text-[11px] font-bold uppercase tracking-widest text-slate-300">Sin entrega</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showGradeModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100">
          <div class="p-8 pb-0 flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Calificar Entrega</h2>
              <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                {{ gradingSubmission ? getSubmissionStudentName(gradingSubmission) : '' }}
              </p>
            </div>
            <button (click)="closeGradeModal()" class="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <svg class="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-8 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nota *</label>
                <input
                  [(ngModel)]="gradeForm.grade"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  placeholder="0"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calificacion</label>
                <select
                  [(ngModel)]="gradeForm.grade_letter"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                >
                  <option value="">Sin letra</option>
                  <option value="AD">AD - Muy bueno</option>
                  <option value="A">A - Bueno</option>
                  <option value="B">B - En proceso</option>
                  <option value="C">C - En inicio</option>
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retroalimentacion</label>
              <textarea
                [(ngModel)]="gradeForm.feedback"
                rows="3"
                placeholder="Escribe un comentario para el estudiante..."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>

            <div class="flex gap-4 pt-2">
              <button
                (click)="closeGradeModal()"
                class="flex-1 px-6 py-3 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:border-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                (click)="submitGrade()"
                [disabled]="grading() || gradeForm.grade === null"
                class="flex-[2] px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-xs font-bold rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
              >
                {{ grading() ? 'Guardando...' : 'Guardar Calificacion' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class TaskGradingComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);

  rows = signal<AssignmentSubmissionSummaryRow[]>([]);
  loading = signal(false);
  error = signal('');
  showGradeModal = signal(false);
  grading = signal(false);
  metrics = signal<AssignmentMetrics | null>(null);

  courses: Course[] = [];
  assignments: Assignment[] = [];
  selectedCourseId = '';
  selectedAssignmentId = '';
  selectedStatus = '';
  gradingSubmission: TaskSubmission | null = null;

  gradeForm = {
    grade: null as number | null,
    grade_letter: '',
    feedback: '',
  };

  ngOnInit(): void {
    this.academicService.getCourses().subscribe({
      next: (response) => this.courses = response.data || response || [],
      error: () => undefined,
    });

    this.loadAssignments();
    this.loadSubmissions();
  }

  get selectedAssignment(): Assignment | null {
    return this.assignments.find((assignment) => assignment.id === this.selectedAssignmentId) || null;
  }

  submittedCount(): number {
    return this.rows().filter((row) => row.status === 'submitted' || row.status === 'graded').length;
  }

  gradedCount(): number {
    return this.rows().filter((row) => row.status === 'graded').length;
  }

  missingCount(): number {
    return this.rows().filter((row) => row.status === 'missing').length;
  }

  loadAssignments(courseId?: string): void {
    const params = courseId ? { course_id: courseId } : undefined;

    this.taskService.getAssignments(params).subscribe({
      next: (response) => this.assignments = response.data || [],
      error: () => this.assignments = [],
    });
  }

  onCourseChange(): void {
    this.selectedAssignmentId = '';
    this.metrics.set(null);
    this.loadAssignments(this.selectedCourseId || undefined);
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading.set(true);
    this.error.set('');

    if (this.selectedAssignmentId) {
      this.taskService.getAssignmentSubmissionsSummary(this.selectedAssignmentId).subscribe({
        next: (response) => {
          this.metrics.set(response.summary);
          this.rows.set(this.filterRows(response.rows));
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.error?.message || 'No se pudo cargar el resumen de la tarea.');
          this.rows.set([]);
          this.metrics.set(null);
          this.loading.set(false);
        },
      });
      return;
    }

    const params: { assignment_id?: string; course_id?: string; status?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedStatus && this.selectedStatus !== 'missing') {
      params.status = this.selectedStatus;
    }

    this.taskService.getSubmissions(params).subscribe({
      next: (response) => {
        const rows = (response.data || []).map((submission) => this.mapSubmissionToRow(submission));
        this.rows.set(this.selectedStatus === 'missing' ? [] : rows);
        this.metrics.set(null);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar las entregas.');
        this.rows.set([]);
        this.metrics.set(null);
        this.loading.set(false);
      },
    });
  }

  openGradeModal(submission: TaskSubmission): void {
    this.gradingSubmission = submission;
    this.gradeForm = {
      grade: submission.grade ?? null,
      grade_letter: submission.grade_letter || '',
      feedback: submission.feedback || '',
    };
    this.showGradeModal.set(true);
  }

  closeGradeModal(): void {
    this.showGradeModal.set(false);
    this.gradingSubmission = null;
  }

  submitGrade(): void {
    if (!this.gradingSubmission || this.grading() || this.gradeForm.grade === null) {
      return;
    }

    this.grading.set(true);

    this.taskService.gradeSubmission(this.gradingSubmission.id, {
      status: 'graded',
      grade: this.gradeForm.grade,
      grade_letter: this.gradeForm.grade_letter || undefined,
      feedback: this.gradeForm.feedback || undefined,
    }).subscribe({
      next: () => {
        this.grading.set(false);
        this.closeGradeModal();
        this.loadSubmissions();
      },
      error: (error) => {
        this.grading.set(false);
        alert('Error al calificar: ' + (error.error?.message || 'Intentalo nuevamente'));
      },
    });
  }

  getStudentName(row: AssignmentSubmissionSummaryRow): string {
    return row.student?.full_name
      || `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim()
      || 'Estudiante';
  }

  getSubmissionStudentName(submission: TaskSubmission): string {
    return submission.student?.full_name
      || `${submission.student?.first_name || ''} ${submission.student?.last_name || ''}`.trim()
      || 'Estudiante';
  }

  getInitials(row: AssignmentSubmissionSummaryRow): string {
    const parts = this.getStudentName(row).split(' ').filter(Boolean).slice(0, 2);

    return parts.map((part) => part.charAt(0)).join('').toUpperCase() || 'E';
  }

  getAssignmentTitle(row: AssignmentSubmissionSummaryRow): string {
    return row.submission?.assignment?.title || this.selectedAssignment?.title || '-';
  }

  getCourseName(row: AssignmentSubmissionSummaryRow): string {
    return row.submission?.assignment?.course?.name || this.selectedAssignment?.course?.name || '-';
  }

  getStatusLabel(status: AssignmentSubmissionSummaryRow['status']): string {
    const labels: Record<AssignmentSubmissionSummaryRow['status'], string> = {
      graded: 'Calificado',
      submitted: 'Entregado',
      missing: 'Sin entrega',
    };

    return labels[status];
  }

  getStatusClass(status: AssignmentSubmissionSummaryRow['status']): string {
    const classes: Record<AssignmentSubmissionSummaryRow['status'], string> = {
      graded: 'bg-green-100 text-green-700',
      submitted: 'bg-amber-100 text-amber-700',
      missing: 'bg-rose-100 text-rose-700',
    };

    return classes[status];
  }

  private filterRows(rows: AssignmentSubmissionSummaryRow[]): AssignmentSubmissionSummaryRow[] {
    if (!this.selectedStatus) {
      return rows;
    }

    return rows.filter((row) => row.status === this.selectedStatus);
  }

  private mapSubmissionToRow(submission: TaskSubmission): AssignmentSubmissionSummaryRow {
    return {
      student_id: submission.student_id,
      student: submission.student || { id: submission.student_id },
      submission,
      status: submission.status === 'graded' ? 'graded' : 'submitted',
    };
  }
}
