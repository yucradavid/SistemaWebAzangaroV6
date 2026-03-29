import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AuthService, AcademicContextStudent } from '@core/services/auth.service';
import { Assignment, TaskService, TaskSubmission } from '@core/services/task.service';
import { forkJoin } from 'rxjs';

type StudentTaskFilter = 'all' | 'today' | 'week' | 'overdue' | 'submitted';
type StudentTaskStatus = 'pendiente' | 'entregada' | 'calificada' | 'vencida';

interface StudentTaskView {
  assignment: Assignment;
  submission: TaskSubmission | null;
  status: StudentTaskStatus;
  title: string;
  description: string;
  due_date?: string | null;
  courseName: string;
  courseCode: string;
  sectionLabel: string;
  score?: number | null;
  max_score?: number | null;
  feedback?: string | null;
}

@Component({
  selector: 'app-tasks-student',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <app-back-button link="/app/dashboard/student"></app-back-button>

      <section class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Alumno</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900">Mis tareas</h1>
        <p class="mt-2 text-sm font-medium text-slate-500">
          Revisa tus actividades pendientes, entrega a tiempo y consulta tus devoluciones.
        </p>
      </section>

      <div *ngIf="student" class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contexto academico</p>
          <h2 class="mt-2 text-xl font-black text-slate-900">{{ student.full_name }}</h2>
          <p class="mt-1 text-sm font-medium text-slate-500">
            {{ student.student_code }} | {{ getStudentSectionLabel() }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="px-3 py-2 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black uppercase tracking-wider">
            Total {{ allTasks.length }}
          </span>
          <span class="px-3 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-wider">
            Pendientes {{ getStatusCount('pendiente') }}
          </span>
          <span class="px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider">
            Vencidas {{ getStatusCount('vencida') }}
          </span>
          <span class="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
            Entregadas {{ getSubmittedCount() }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <button
          *ngFor="let filter of filters"
          type="button"
          (click)="setFilter(filter.id)"
          [ngClass]="activeFilter === filter.id ? 'border-blue-900 ring-2 ring-blue-100 shadow-lg' : 'border-slate-200 hover:border-slate-300'"
          class="bg-white border rounded-3xl p-5 text-left transition-all shadow-sm"
        >
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ filter.label }}</p>
          <h2 class="mt-3 text-3xl font-black text-slate-900">{{ getFilterCount(filter.id) }}</h2>
        </button>
      </div>

      <div *ngIf="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
        {{ error }}
      </div>

      <section *ngIf="!loading && !filteredTasks.length" class="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-300">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"></path>
            <path d="M14 2v6h6"></path>
          </svg>
        </div>
        <h2 class="mt-5 text-xl font-bold text-slate-900">No hay tareas en este filtro</h2>
        <p class="mt-2 text-sm font-medium text-slate-500">
          Cambia el filtro o espera a que tus docentes publiquen nuevas actividades.
        </p>
      </section>

      <section *ngIf="!loading && filteredTasks.length" class="space-y-4">
        <article *ngFor="let task of filteredTasks" class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" [ngClass]="getStatusClass(task.status)">
                  {{ task.status }}
                </span>
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  {{ task.courseCode }}
                </span>
                <span *ngIf="isDueToday(task)" class="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                  Vence hoy
                </span>
              </div>

              <div>
                <h2 class="text-xl font-black text-slate-900">{{ task.title }}</h2>
                <p class="mt-1 text-sm font-semibold text-slate-500">{{ task.courseName }} | {{ task.sectionLabel }}</p>
              </div>

              <p *ngIf="task.description" class="text-sm leading-6 text-slate-600 max-w-3xl">{{ task.description }}</p>

              <div class="flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
                <span>Limite: <strong class="text-slate-800">{{ task.due_date ? (task.due_date | date:'dd/MM/yyyy HH:mm') : 'Sin fecha' }}</strong></span>
                <span *ngIf="task.submission?.submission_date">Entregado: <strong class="text-slate-800">{{ task.submission?.submission_date | date:'dd/MM/yyyy HH:mm' }}</strong></span>
                <span *ngIf="task.status === 'calificada'">Nota: <strong class="text-emerald-700">{{ task.score ?? '-' }}/{{ task.max_score ?? '-' }}</strong></span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                (click)="openDetail(task)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50"
              >
                Ver detalle
              </button>
              <button
                *ngIf="canSubmit(task)"
                type="button"
                (click)="openSubmission(task)"
                class="px-4 py-2 rounded-xl bg-blue-900 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-800"
              >
                {{ task.submission ? 'Actualizar entrega' : 'Entregar tarea' }}
              </button>
            </div>
          </div>
        </article>
      </section>

      <div *ngIf="detailTask" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalle</p>
              <h2 class="mt-1 text-2xl font-black text-slate-900">{{ detailTask.title }}</h2>
            </div>
            <button type="button" (click)="closeDetail()" class="p-2 rounded-xl hover:bg-slate-50 text-slate-400">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Curso</p>
                <p class="mt-2 text-sm font-bold text-slate-900">{{ detailTask.courseName }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha limite</p>
                <p class="mt-2 text-sm font-bold text-slate-900">{{ detailTask.due_date ? (detailTask.due_date | date:'dd/MM/yyyy HH:mm') : 'Sin fecha' }}</p>
              </div>
            </div>

            <div *ngIf="detailTask.assignment.instructions" class="rounded-2xl bg-blue-50/50 border border-blue-100 p-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-blue-500">Indicaciones</p>
              <p class="mt-2 text-sm leading-6 text-slate-700">{{ detailTask.assignment.instructions }}</p>
            </div>

            <div *ngIf="detailTask.description" class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripcion</p>
              <p class="mt-2 text-sm leading-6 text-slate-700">{{ detailTask.description }}</p>
            </div>

            <div *ngIf="detailTask.submission" class="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-3">
              <div class="flex flex-wrap gap-3 items-center">
                <span class="px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  {{ detailTask.status }}
                </span>
                <span *ngIf="detailTask.submission?.submission_date" class="text-sm font-semibold text-slate-600">
                  Enviado: {{ detailTask.submission.submission_date | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>

              <div *ngIf="detailTask.submission?.content">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Mi entrega</p>
                <p class="mt-2 text-sm leading-6 text-slate-700">{{ detailTask.submission.content }}</p>
              </div>

              <div *ngIf="detailTask.submission?.attachment_url">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Archivo o enlace</p>
                <a [href]="detailTask.submission.attachment_url || '#'" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-bold text-blue-700 hover:underline">
                  {{ detailTask.submission.attachment_name || detailTask.submission.attachment_url }}
                </a>
              </div>
            </div>

            <div *ngIf="detailTask.status === 'calificada'" class="rounded-2xl bg-amber-50/60 border border-amber-100 p-4 space-y-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-amber-600">Retroalimentacion</p>
              <p class="text-sm font-semibold text-slate-700">
                Nota: {{ detailTask.score ?? '-' }}/{{ detailTask.max_score ?? '-' }}
                <span *ngIf="detailTask.submission?.grade_letter">({{ detailTask.submission?.grade_letter }})</span>
              </p>
              <p class="text-sm leading-6 text-slate-700">{{ detailTask.feedback || 'Todavia no hay comentario del docente.' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="submissionTask" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega</p>
              <h2 class="mt-1 text-2xl font-black text-slate-900">{{ submissionTask.title }}</h2>
            </div>
            <button type="button" (click)="closeSubmission()" class="p-2 rounded-xl hover:bg-slate-50 text-slate-400">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveSubmission($event)" class="p-6 space-y-5">
            <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-medium text-slate-600">
              Limite: <strong class="text-slate-900">{{ submissionTask.due_date ? (submissionTask.due_date | date:'dd/MM/yyyy HH:mm') : 'Sin fecha' }}</strong>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripcion de tu entrega</label>
              <textarea
                [(ngModel)]="submissionForm.content"
                name="content"
                rows="6"
                placeholder="Escribe aqui tu respuesta, resumen o comentarios para el docente"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Enlace o archivo subido</label>
              <input
                [(ngModel)]="submissionForm.attachment_url"
                name="attachment_url"
                type="url"
                placeholder="https://..."
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
              >
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeSubmission()" class="flex-1 px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" [disabled]="saving" class="flex-[1.4] px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-60">
                {{ saving ? 'Guardando...' : (submissionTask.submission ? 'Actualizar entrega' : 'Enviar entrega') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class TasksStudentComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);

  loading = false;
  saving = false;
  error = '';

  student: AcademicContextStudent | null = null;
  activeFilter: StudentTaskFilter = 'all';
  allTasks: StudentTaskView[] = [];
  filteredTasks: StudentTaskView[] = [];

  detailTask: StudentTaskView | null = null;
  submissionTask: StudentTaskView | null = null;

  submissionForm = {
    content: '',
    attachment_url: '',
  };

  readonly filters: Array<{ id: StudentTaskFilter; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'today', label: 'Para hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'overdue', label: 'Vencidas' },
    { id: 'submitted', label: 'Entregadas' },
  ];

  ngOnInit(): void {
    this.loadTasks();
  }

  setFilter(filter: StudentTaskFilter): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  openDetail(task: StudentTaskView): void {
    this.detailTask = task;
  }

  closeDetail(): void {
    this.detailTask = null;
  }

  openSubmission(task: StudentTaskView): void {
    this.submissionTask = task;
    this.submissionForm = {
      content: task.submission?.content || '',
      attachment_url: task.submission?.attachment_url || '',
    };
  }

  closeSubmission(): void {
    this.submissionTask = null;
    this.submissionForm = { content: '', attachment_url: '' };
  }

  canSubmit(task: StudentTaskView): boolean {
    return task.status !== 'calificada';
  }

  isDueToday(task: StudentTaskView): boolean {
    if (!task.due_date) {
      return false;
    }

    const due = new Date(task.due_date);
    const now = new Date();

    return due.getFullYear() === now.getFullYear()
      && due.getMonth() === now.getMonth()
      && due.getDate() === now.getDate();
  }

  getStatusClass(status: StudentTaskStatus): string {
    const classes: Record<StudentTaskStatus, string> = {
      pendiente: 'bg-blue-50 text-blue-700',
      entregada: 'bg-cyan-50 text-cyan-700',
      calificada: 'bg-emerald-50 text-emerald-700',
      vencida: 'bg-rose-50 text-rose-700',
    };

    return classes[status];
  }

  getFilterCount(filter: StudentTaskFilter): number {
    return this.allTasks.filter((task) => this.matchesFilter(task, filter)).length;
  }

  getStatusCount(status: StudentTaskStatus): number {
    return this.allTasks.filter((task) => task.status === status).length;
  }

  getSubmittedCount(): number {
    return this.allTasks.filter((task) => task.status === 'entregada' || task.status === 'calificada').length;
  }

  getStudentSectionLabel(): string {
    const gradeLevel = this.student?.section?.grade_level;
    const sectionLetter = this.student?.section?.section_letter;
    const section = sectionLetter ? `Seccion ${sectionLetter}` : 'Seccion';

    if (gradeLevel?.grade && gradeLevel?.level) {
      return `${gradeLevel.grade} ${gradeLevel.level} - ${section}`;
    }

    return section;
  }

  saveSubmission(event: Event): void {
    event.preventDefault();

    if (!this.student || !this.submissionTask || this.saving) {
      return;
    }

    if (!this.submissionForm.content.trim() && !this.submissionForm.attachment_url.trim()) {
      this.error = 'Debes escribir una descripcion o adjuntar un enlace para enviar la tarea.';
      return;
    }

    this.saving = true;
    this.error = '';

    const attachmentUrl = this.submissionForm.attachment_url.trim();
    const payload = {
      assignment_id: this.submissionTask.assignment.id,
      student_id: this.student.id,
      content: this.submissionForm.content.trim() || null,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentUrl ? this.buildAttachmentName(attachmentUrl) : null,
      status: 'submitted' as const,
    };

    const request = this.submissionTask.submission
      ? this.taskService.updateSubmission(this.submissionTask.submission.id, payload)
      : this.taskService.createSubmission(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeSubmission();
        this.loadTasks();
      },
      error: (error) => {
        this.saving = false;
        this.error = this.extractError(error, 'No se pudo guardar la entrega.');
      },
    });
  }

  private loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.student = context.students?.[0] || null;

        if (!this.student) {
          this.allTasks = [];
          this.filteredTasks = [];
          this.loading = false;
          this.error = 'No se encontro el estudiante asociado al usuario autenticado.';
          return;
        }

        forkJoin({
          assignments: this.taskService.getAssignments(),
          submissions: this.taskService.getSubmissions(),
        }).subscribe({
          next: ({ assignments, submissions }) => {
            const submissionMap = new Map<string, TaskSubmission>();
            for (const submission of submissions.data || []) {
              if (submission.assignment_id) {
                submissionMap.set(submission.assignment_id, submission);
              }
            }

            this.allTasks = (assignments.data || [])
              .map((assignment) => this.toTaskView(assignment, submissionMap.get(assignment.id) || null))
              .sort((left, right) => this.compareTasks(left, right));

            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            this.loading = false;
            this.allTasks = [];
            this.filteredTasks = [];
            this.error = this.extractError(error, 'No se pudieron cargar las tareas del alumno.');
          },
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = this.extractError(error, 'No se pudo cargar el contexto academico del alumno.');
      },
    });
  }

  private applyFilters(): void {
    this.filteredTasks = this.allTasks.filter((task) => this.matchesFilter(task, this.activeFilter));
  }

  private matchesFilter(task: StudentTaskView, filter: StudentTaskFilter): boolean {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'submitted') {
      return task.status === 'entregada' || task.status === 'calificada';
    }

    if (filter === 'overdue') {
      return task.status === 'vencida';
    }

    if (!task.due_date) {
      return false;
    }

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (filter === 'today') {
      return dueDate >= todayStart && dueDate < tomorrowStart;
    }

    if (filter === 'week') {
      return dueDate >= todayStart && dueDate <= weekEnd;
    }

    return true;
  }

  private toTaskView(assignment: Assignment, submission: TaskSubmission | null): StudentTaskView {
    const status = this.resolveTaskStatus(assignment, submission);
    const sectionLetter = assignment.section?.section_letter ? `Seccion ${assignment.section.section_letter}` : 'Seccion';
    const gradeLevel = assignment.section?.grade_level;
    const sectionLabel = gradeLevel?.grade && gradeLevel?.level
      ? `${gradeLevel.grade} ${gradeLevel.level} - ${sectionLetter}`
      : sectionLetter;

    return {
      assignment,
      submission,
      status,
      title: assignment.title,
      description: assignment.description || assignment.instructions || '',
      due_date: assignment.due_date,
      courseName: assignment.course?.name || 'Curso',
      courseCode: assignment.course?.code || 'CURSO',
      sectionLabel,
      score: submission?.grade ?? null,
      max_score: assignment.max_score ?? null,
      feedback: submission?.feedback ?? null,
    };
  }

  private resolveTaskStatus(assignment: Assignment, submission: TaskSubmission | null): StudentTaskStatus {
    if (submission?.status === 'graded') {
      return 'calificada';
    }

    if (submission) {
      return 'entregada';
    }

    return assignment.timing_status === 'overdue' ? 'vencida' : 'pendiente';
  }

  private compareTasks(left: StudentTaskView, right: StudentTaskView): number {
    const priority = {
      vencida: 0,
      pendiente: 1,
      entregada: 2,
      calificada: 3,
    };

    const priorityDiff = priority[left.status] - priority[right.status];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return this.getDueTimestamp(left.due_date) - this.getDueTimestamp(right.due_date);
  }

  private getDueTimestamp(dueDate?: string | null): number {
    if (!dueDate) {
      return Number.MAX_SAFE_INTEGER;
    }

    const timestamp = new Date(dueDate).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  private buildAttachmentName(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const lastSegment = parsedUrl.pathname.split('/').filter(Boolean).pop();
      return lastSegment || url;
    } catch {
      return url;
    }
  }

  private extractError(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      const firstValue = validationErrors[firstKey];
      if (Array.isArray(firstValue) && firstValue[0]) {
        return firstValue[0];
      }
    }

    return error?.error?.message || fallback;
  }
}
