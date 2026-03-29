import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { Assignment, TaskService, TaskSubmission } from '@core/services/task.service';
import { forkJoin } from 'rxjs';

type GuardianTaskFilter = 'all' | 'today' | 'week' | 'overdue' | 'submitted';
type GuardianTaskStatus = 'pendiente' | 'entregada' | 'calificada' | 'vencida';

interface GuardianTaskView {
  assignment: Assignment;
  submission: TaskSubmission | null;
  status: GuardianTaskStatus;
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
  selector: 'app-apoderado-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apoderado-tasks.component.html',
  styleUrls: ['./apoderado-tasks.component.css']
})
export class ApoderadoTasksComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);

  students: AcademicContextStudent[] = [];
  selectedStudentId = '';

  loading = false;
  error = '';
  activeFilter: GuardianTaskFilter = 'all';

  allTasks: GuardianTaskView[] = [];
  filteredTasks: GuardianTaskView[] = [];
  detailTask: GuardianTaskView | null = null;

  readonly filters: Array<{ id: GuardianTaskFilter; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'today', label: 'Para hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'overdue', label: 'Vencidas' },
    { id: 'submitted', label: 'Entregadas' },
  ];

  ngOnInit(): void {
    this.loadAcademicContext();
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  onStudentChange(): void {
    this.loadTasks();
  }

  setFilter(filter: GuardianTaskFilter): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  openDetail(task: GuardianTaskView): void {
    this.detailTask = task;
  }

  closeDetail(): void {
    this.detailTask = null;
  }

  getStatusClass(status: GuardianTaskStatus): string {
    const classes: Record<GuardianTaskStatus, string> = {
      pendiente: 'bg-blue-50 text-blue-700',
      entregada: 'bg-cyan-50 text-cyan-700',
      calificada: 'bg-emerald-50 text-emerald-700',
      vencida: 'bg-rose-50 text-rose-700',
    };

    return classes[status];
  }

  isDueToday(task: GuardianTaskView): boolean {
    if (!task.due_date) {
      return false;
    }

    const due = new Date(task.due_date);
    const now = new Date();

    return due.getFullYear() === now.getFullYear()
      && due.getMonth() === now.getMonth()
      && due.getDate() === now.getDate();
  }

  getFilterCount(filter: GuardianTaskFilter): number {
    return this.allTasks.filter((task) => this.matchesFilter(task, filter)).length;
  }

  getStatusCount(status: GuardianTaskStatus): number {
    return this.allTasks.filter((task) => task.status === status).length;
  }

  getSubmittedCount(): number {
    return this.allTasks.filter((task) => task.status === 'entregada' || task.status === 'calificada').length;
  }

  getSelectedStudentLabel(): string {
    const gradeLevel = this.selectedStudent?.section?.grade_level;
    const sectionLetter = this.selectedStudent?.section?.section_letter;
    const section = sectionLetter ? `Seccion ${sectionLetter}` : 'Seccion';

    if (gradeLevel?.grade && gradeLevel?.level) {
      return `${gradeLevel.grade} ${gradeLevel.level} - ${section}`;
    }

    return section;
  }

  private loadAcademicContext(): void {
    this.loading = true;
    this.error = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.students = context.students || [];
        this.selectedStudentId = this.students[0]?.id || '';

        if (!this.students.length) {
          this.loading = false;
          this.error = 'Tu usuario no tiene estudiantes vinculados.';
          return;
        }

        this.loadTasks();
      },
      error: (error) => {
        this.loading = false;
        this.error = this.extractError(error, 'No se pudo obtener el contexto academico del apoderado.');
      }
    });
  }

  private loadTasks(): void {
    if (!this.selectedStudentId) {
      this.loading = false;
      this.allTasks = [];
      this.filteredTasks = [];
      return;
    }

    this.loading = true;
    this.error = '';

    forkJoin({
      assignments: this.taskService.getAssignments({ student_id: this.selectedStudentId }),
      submissions: this.taskService.getSubmissions({ student_id: this.selectedStudentId }),
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
        this.error = this.extractError(error, 'No se pudieron cargar las tareas del estudiante seleccionado.');
      }
    });
  }

  private applyFilters(): void {
    this.filteredTasks = this.allTasks.filter((task) => this.matchesFilter(task, this.activeFilter));
  }

  private matchesFilter(task: GuardianTaskView, filter: GuardianTaskFilter): boolean {
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

  private toTaskView(assignment: Assignment, submission: TaskSubmission | null): GuardianTaskView {
    const sectionLetter = assignment.section?.section_letter ? `Seccion ${assignment.section.section_letter}` : 'Seccion';
    const gradeLevel = assignment.section?.grade_level;
    const sectionLabel = gradeLevel?.grade && gradeLevel?.level
      ? `${gradeLevel.grade} ${gradeLevel.level} - ${sectionLetter}`
      : sectionLetter;

    return {
      assignment,
      submission,
      status: this.resolveTaskStatus(assignment, submission),
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

  private resolveTaskStatus(assignment: Assignment, submission: TaskSubmission | null): GuardianTaskStatus {
    if (submission?.status === 'graded') {
      return 'calificada';
    }

    if (submission) {
      return 'entregada';
    }

    return assignment.timing_status === 'overdue' ? 'vencida' : 'pendiente';
  }

  private compareTasks(left: GuardianTaskView, right: GuardianTaskView): number {
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
