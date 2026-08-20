import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, Section } from '@core/services/academic.service';
import { Assignment, TaskService } from '@core/services/task.service';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);
  private router = inject(Router);

  tasks: Assignment[] = [];
  courses: Course[] = [];
  sections: Section[] = [];

  loadingContext = true;
  loadingTasks = false;
  saving = false;
  showModal = false;

  error = '';
  selectedCourseId = '';
  selectedSectionId = '';
  editingTask: Assignment | null = null;

  form = {
    title: '',
    description: '',
    instructions: '',
    course_id: '',
    section_id: '',
    due_date: '',
    max_score: null as number | null,
  };

  ngOnInit(): void {
    this.academicService.getCourses().subscribe({
      next: (response) => this.courses = response.data || response || [],
      error: () => undefined,
    });

    this.academicService.getSections().subscribe({
      next: (response) => this.sections = response.data || response || [],
      error: () => undefined,
    });

    this.loadTasks();
  }

  get totalExpected(): number {
    return this.tasks.reduce((total, task) => total + (task.metrics?.expected_count ?? 0), 0);
  }

  get totalSubmitted(): number {
    return this.tasks.reduce((total, task) => total + (task.metrics?.submitted_count ?? 0), 0);
  }

  get totalPending(): number {
    return this.tasks.reduce((total, task) => total + (task.metrics?.pending_count ?? 0), 0);
  }

  get totalMissing(): number {
    return this.tasks.reduce((total, task) => total + (task.metrics?.missing_count ?? 0), 0);
  }

  get orderedTasks(): Assignment[] {
    return [...this.tasks].sort((left, right) => {
      const priorityDiff = this.getTaskPriority(right) - this.getTaskPriority(left);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return this.getDueTimestamp(left) - this.getDueTimestamp(right);
    });
  }

  get attentionTasks(): Assignment[] {
    return this.orderedTasks.filter((task) => this.needsAttention(task)).slice(0, 3);
  }

  get filteredSections(): Section[] {
    if (!this.selectedCourseId) {
      return this.sections;
    }

    return this.sections.filter((section) =>
      this.tasks.some((task) => task.course_id === this.selectedCourseId && task.section_id === section.id)
    );
  }

  onCourseFilterChange(): void {
    const sectionStillAvailable = this.filteredSections.some((section) => section.id === this.selectedSectionId);
    if (!sectionStillAvailable) {
      this.selectedSectionId = '';
    }

    this.loadTasks();
  }

  onSectionFilterChange(): void {
    this.loadTasks();
  }

  onModalCourseChange(): void {
    const matchingSections = this.getModalSections(this.form.course_id);
    const sectionStillAvailable = matchingSections.some((section) => section.id === this.form.section_id);
    if (!sectionStillAvailable) {
      this.form.section_id = matchingSections[0]?.id || '';
    }
  }

  openCreateModal(): void {
    this.editingTask = null;
    this.form = {
      title: '',
      description: '',
      instructions: '',
      course_id: this.selectedCourseId,
      section_id: this.selectedSectionId,
      due_date: '',
      max_score: null,
    };
    this.showModal = true;
    this.error = '';
  }

  openEditModal(task: Assignment): void {
    this.editingTask = task;
    this.form = {
      title: task.title,
      description: task.description || '',
      instructions: task.instructions || '',
      course_id: task.course_id,
      section_id: task.section_id,
      due_date: this.toDatetimeLocal(task.due_date),
      max_score: task.max_score ?? null,
    };
    this.showModal = true;
    this.error = '';
  }

  duplicateTask(task: Assignment): void {
    this.editingTask = null;
    this.form = {
      title: `${task.title} (copia)`,
      description: task.description || '',
      instructions: task.instructions || '',
      course_id: task.course_id,
      section_id: task.section_id,
      due_date: this.toDatetimeLocal(task.due_date),
      max_score: task.max_score ?? null,
    };
    this.showModal = true;
    this.error = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTask = null;
  }

  openGrading(task?: Assignment): void {
    const queryParams: Record<string, string> = {};

    if (task) {
      queryParams['assignment_id'] = task.id;
      queryParams['course_id'] = task.course_id;
      queryParams['section_id'] = task.section_id;
    } else {
      if (this.selectedCourseId) {
        queryParams['course_id'] = this.selectedCourseId;
      }
      if (this.selectedSectionId) {
        queryParams['section_id'] = this.selectedSectionId;
      }
    }

    this.router.navigate(['/app/tasks/grading'], { queryParams });
  }

  saveTask(event: Event): void {
    event.preventDefault();

    if (this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';

    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim() || null,
      instructions: this.form.instructions.trim() || null,
      course_id: this.form.course_id,
      section_id: this.form.section_id,
      due_date: this.form.due_date || null,
      max_score: this.form.max_score,
    };

    const request = this.editingTask
      ? this.taskService.updateAssignment(this.editingTask.id, payload)
      : this.taskService.createAssignment(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadTasks();
      },
      error: (error) => {
        this.saving = false;
        this.error = this.extractError(error, 'No se pudo guardar la tarea.');
      },
    });
  }

  deleteTask(task: Assignment): void {
    if (!confirm(`Eliminar la tarea "${task.title}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    this.taskService.deleteAssignment(task.id).subscribe({
      next: () => this.loadTasks(),
      error: (error) => alert(error.error?.message || 'Error al eliminar la tarea.'),
    });
  }

  getCourseName(task: Assignment): string {
    return task.course?.name
      || this.courses.find((course) => course.id === task.course_id)?.name
      || 'Curso';
  }

  getSectionLabel(task: Assignment): string {
    const sectionLetter = task.section?.section_letter
      || this.sections.find((section) => section.id === task.section_id)?.section_letter;
    const gradeLevel = task.section?.grade_level;
    const gradeLabel = gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}` : '';
    const sectionLabel = sectionLetter ? `Seccion ${sectionLetter}` : 'Seccion';

    return gradeLabel ? `${gradeLabel} - ${sectionLabel}` : sectionLabel;
  }

  getSectionOptionLabel(section: Section): string {
    return section.section_letter ? `Seccion ${section.section_letter}` : 'Seccion';
  }

  getModalSections(courseId?: string): Section[] {
    if (!courseId) {
      return this.sections;
    }

    const sectionIds = new Set(
      this.tasks.filter((t) => t.course_id === courseId).map((t) => t.section_id)
    );

    return this.sections.filter((section) => sectionIds.has(section.id));
  }

  isOverdue(dueDate?: string | null): boolean {
    return !!dueDate && new Date(dueDate).getTime() < Date.now();
  }

  needsAttention(task: Assignment): boolean {
    return !!task.requires_attention
      || (task.metrics?.pending_count ?? 0) > 0
      || (task.metrics?.missing_count ?? 0) > 0
      || this.getTimingStatus(task) === 'overdue';
  }

  getTimingStatus(task: Assignment): Assignment['timing_status'] {
    if (task.timing_status) {
      return task.timing_status;
    }

    if (!task.due_date) {
      return 'undated';
    }

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const isSameDay = dueDate.getFullYear() === now.getFullYear()
      && dueDate.getMonth() === now.getMonth()
      && dueDate.getDate() === now.getDate();

    if (isSameDay) {
      return 'due_today';
    }

    return dueDate.getTime() < now.getTime() ? 'overdue' : 'upcoming';
  }

  getTimingLabel(task: Assignment): string {
    const labels: Record<NonNullable<Assignment['timing_status']>, string> = {
      overdue: 'Vencida',
      due_today: 'Vence hoy',
      upcoming: 'Activa',
      undated: 'Sin fecha',
    };

    return labels[this.getTimingStatus(task) || 'undated'];
  }

  getTimingClass(task: Assignment): string {
    const classes: Record<NonNullable<Assignment['timing_status']>, string> = {
      overdue: 'bg-rose-50 text-rose-700',
      due_today: 'bg-amber-50 text-amber-700',
      upcoming: 'bg-emerald-50 text-emerald-700',
      undated: 'bg-slate-100 text-slate-600',
    };

    return classes[this.getTimingStatus(task) || 'undated'];
  }

  private loadTasks(): void {
    this.loadingTasks = true;
    this.error = '';

    const params: { course_id?: string; section_id?: string } = {};
    if (this.selectedCourseId) {
      params.course_id = this.selectedCourseId;
    }
    if (this.selectedSectionId) {
      params.section_id = this.selectedSectionId;
    }

    this.taskService.getAssignments(params).subscribe({
      next: (response) => {
        this.tasks = response.data || [];
        this.loadingTasks = false;
        this.loadingContext = false;
      },
      error: (error) => {
        this.tasks = [];
        this.loadingTasks = false;
        this.loadingContext = false;
        this.error = this.extractError(error, 'No se pudieron cargar las tareas.');
      },
    });
  }

  private getTaskPriority(task: Assignment): number {
    const timingWeight = {
      overdue: 40,
      due_today: 20,
      upcoming: 5,
      undated: 0,
    }[this.getTimingStatus(task) || 'undated'];

    return timingWeight
      + ((task.metrics?.missing_count ?? 0) * 10)
      + ((task.metrics?.pending_count ?? 0) * 5)
      + (task.requires_attention ? 15 : 0);
  }

  private getDueTimestamp(task: Assignment): number {
    if (!task.due_date) {
      return Number.MAX_SAFE_INTEGER;
    }

    const timestamp = new Date(task.due_date).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  private toDatetimeLocal(value?: string | null): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toISOString().slice(0, 16);
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
