import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, Section, TeacherCourseAssignment } from '@core/services/academic.service';
import { Assignment, TaskService } from '@core/services/task.service';
import { AdminBackButtonComponent } from "@shared/components/back-button/admin-back-button.component";

@Component({
  selector: 'app-teacher-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent, AdminBackButtonComponent],
  templateUrl: './teacher-tasks.component.html',
  styleUrls: ['./teacher-tasks.component.css']
})
export class TeacherTasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private academicService = inject(AcademicService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  teacherAssignments: TeacherCourseAssignment[] = [];
  tasks: Assignment[] = [];

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
    const queryMap = this.route.snapshot.queryParamMap;
    this.selectedCourseId = queryMap.get('course_id') || '';
    this.selectedSectionId = queryMap.get('section_id') || '';
    this.loadTeacherAssignments();
  }

  get canCreate(): boolean {
    return this.teacherAssignments.length > 0;
  }

  get courseOptions(): Course[] {
    const map = new Map<string, Course>();

    for (const assignment of this.teacherAssignments) {
      if (assignment.course?.id) {
        map.set(assignment.course.id, assignment.course);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  get sectionOptions(): Section[] {
    const map = new Map<string, Section>();

    for (const assignment of this.filteredTeacherAssignmentsByCourse()) {
      if (assignment.section?.id) {
        map.set(assignment.section.id, assignment.section);
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.section_letter || '').localeCompare(b.section_letter || ''));
  }

  get modalSectionOptions(): Section[] {
    const map = new Map<string, Section>();

    for (const assignment of this.filteredTeacherAssignmentsByCourse(this.form.course_id)) {
      if (assignment.section?.id) {
        map.set(assignment.section.id, assignment.section);
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.section_letter || '').localeCompare(b.section_letter || ''));
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

  onCourseFilterChange(): void {
    const sectionStillAvailable = this.sectionOptions.some((section) => section.id === this.selectedSectionId);
    if (!sectionStillAvailable) {
      this.selectedSectionId = '';
    }

    this.loadTasks();
  }

  onSectionFilterChange(): void {
    this.loadTasks();
  }

  onModalCourseChange(): void {
    const sectionStillAvailable = this.modalSectionOptions.some((section) => section.id === this.form.section_id);
    if (!sectionStillAvailable) {
      this.form.section_id = this.modalSectionOptions[0]?.id || '';
    }
  }

  openCreateModal(): void {
    if (!this.canCreate) {
      return;
    }

    const initialAssignment = this.findPreferredTeacherAssignment();

    this.editingTask = null;
    this.form = {
      title: '',
      description: '',
      instructions: '',
      course_id: initialAssignment?.course_id || '',
      section_id: initialAssignment?.section_id || '',
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

    this.router.navigate(['/app/tasks/grading/teacher'], { queryParams });
  }

  saveTask(event: Event): void {
    event.preventDefault();

    if (this.saving) {
      return;
    }

    if (!this.isAllowedPair(this.form.course_id, this.form.section_id)) {
      this.error = 'Solo puedes registrar tareas en tus cursos y secciones asignados.';
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

  getCourseName(task: Assignment): string {
    return task.course?.name
      || this.courseOptions.find((course) => course.id === task.course_id)?.name
      || 'Curso';
  }

  getSectionLabel(task: Assignment): string {
    const section = task.section || this.teacherAssignments.find((assignment) => assignment.section_id === task.section_id)?.section;
    const sectionLetter = section?.section_letter ? `Seccion ${section.section_letter}` : 'Seccion';
    const gradeLevel = (task.section as any)?.grade_level;

    if (gradeLevel?.grade && gradeLevel?.level) {
      return `${gradeLevel.grade} ${gradeLevel.level} - ${sectionLetter}`;
    }

    return sectionLetter;
  }

  getSectionOptionLabel(section: Section): string {
    return section.section_letter ? `Seccion ${section.section_letter}` : 'Seccion';
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

  private loadTeacherAssignments(): void {
    this.loadingContext = true;
    this.error = '';

    this.academicService.getTeacherCourseAssignments({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        this.teacherAssignments = this.extractRows<TeacherCourseAssignment>(response)
          .filter((assignment) => assignment.course_id && assignment.section_id);
        this.loadingContext = false;
        this.loadTasks();
      },
      error: (error) => {
        this.teacherAssignments = [];
        this.tasks = [];
        this.loadingContext = false;
        this.error = this.extractError(error, 'No se pudo cargar la carga academica del docente.');
      },
    });
  }

  private loadTasks(): void {
    if (!this.teacherAssignments.length) {
      this.tasks = [];
      this.loadingTasks = false;
      return;
    }

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
        this.tasks = (response.data || []).filter((task) => this.isAllowedPair(task.course_id, task.section_id));
        this.loadingTasks = false;
      },
      error: (error) => {
        this.tasks = [];
        this.loadingTasks = false;
        this.error = this.extractError(error, 'No se pudieron cargar las tareas.');
      },
    });
  }

  private filteredTeacherAssignmentsByCourse(courseId?: string): TeacherCourseAssignment[] {
    if (!courseId) {
      return this.teacherAssignments;
    }

    return this.teacherAssignments.filter((assignment) => assignment.course_id === courseId);
  }

  private findPreferredTeacherAssignment(): TeacherCourseAssignment | undefined {
    if (this.selectedCourseId && this.selectedSectionId) {
      return this.teacherAssignments.find((assignment) =>
        assignment.course_id === this.selectedCourseId && assignment.section_id === this.selectedSectionId
      );
    }

    if (this.selectedCourseId) {
      return this.teacherAssignments.find((assignment) => assignment.course_id === this.selectedCourseId);
    }

    return this.teacherAssignments[0];
  }

  private isAllowedPair(courseId: string, sectionId: string): boolean {
    return this.teacherAssignments.some((assignment) =>
      assignment.course_id === courseId && assignment.section_id === sectionId
    );
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

  private extractRows<T>(response: { data?: T[] } | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data || [];
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
