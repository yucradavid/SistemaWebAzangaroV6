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
  templateUrl: './student-tasks.component.html',
  styleUrls: ['./student-tasks.component.css']
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
