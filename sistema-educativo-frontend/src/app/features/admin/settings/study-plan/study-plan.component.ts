//src/app/features/admin/settings/study-plan/study-plan.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { AcademicService, Competency, Course, GradeLevel } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

interface CourseWithCompetencies {
  course: Course;
  competencies: Competency[];
  expanded: boolean;
}

interface GradeGroup {
  grade: GradeLevel;
  expanded: boolean;
  courses: CourseWithCompetencies[];
}

interface LevelMeta {
  label: string;
  accent: string;
  badge: string;
  chip: string;
}

@Component({
  selector: 'app-study-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent],
  templateUrl: './study-plan.component.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudyPlanComponent implements OnInit {
  gradeGroups: GradeGroup[] = [];
  gradeLevels: GradeLevel[] = [];
  selectedGradeFilter = '';
  loading = false;

  // Modal de curso
  showCourseModal = false;
  isEditingCourse = false;
  courseSubmitting = false;
  currentCourseEditId: string | null = null;
  courseForm: FormGroup;

  // Modal de competencia (siempre se abre con un curso de contexto)
  showCompetencyModal = false;
  isEditingCompetency = false;
  competencySubmitting = false;
  currentCompetencyEditId: string | null = null;
  contextCourse: Course | null = null;
  competencyForm: FormGroup;

  private courses: Course[] = [];
  private competencies: Competency[] = [];
  private expandedGrades: Record<string, boolean> = {};
  private expandedCourses: Record<string, boolean> = {};
  private expandedDescriptions: Record<string, boolean> = {};

  // Colores por nivel: Inicial → amber, Primaria → emerald, Secundaria → cermat-blue
  private readonly levelMeta: Record<string, LevelMeta> = {
    inicial: {
      label: 'Inicial',
      accent: 'border-amber-500',
      badge: 'bg-gradient-to-br from-amber-500 to-orange-500',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    primaria: {
      label: 'Primaria',
      accent: 'border-emerald-600',
      badge: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    secundaria: {
      label: 'Secundaria',
      accent: 'border-cermat-blue-700',
      badge: 'bg-gradient-to-br from-cermat-blue-900 to-cermat-blue-700',
      chip: 'bg-cermat-blue-50 text-cermat-blue-800 border-cermat-blue-200',
    },
  };

  private readonly levelOrder: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.courseForm = this.fb.group({
      grade_level_id: ['', Validators.required],
      name: ['', Validators.required],
      code: ['', Validators.required],
      hours_per_week: [4, [Validators.required, Validators.min(1)]],
      color: ['#2563EB'],
    });

    this.competencyForm = this.fb.group({
      course_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      order: [1, [Validators.min(1)]],
    });
  }

  get filteredGradeGroups(): GradeGroup[] {
    if (!this.selectedGradeFilter) {
      return this.gradeGroups;
    }
    return this.gradeGroups.filter((group) => group.grade.id === this.selectedGradeFilter);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      grades: this.academicService.getGradeLevels({ per_page: 100 }),
      courses: this.academicService.getCourses({ per_page: 200 }),
      competencies: this.academicService.getCompetencies({ per_page: 500 }),
    }).subscribe({
      next: ({ grades, courses, competencies }) => {
        this.gradeLevels = this.extractCollection<GradeLevel>(grades);
        this.courses = this.extractCollection<Course>(courses);
        this.competencies = this.extractCollection<Competency>(competencies);
        this.buildGroups();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'No se pudo cargar el plan de estudios.', 'error');
      },
    });
  }

  private buildGroups(): void {
    const competenciesByCourse: Record<string, Competency[]> = {};
    this.competencies.forEach((competency) => {
      if (!competenciesByCourse[competency.course_id]) {
        competenciesByCourse[competency.course_id] = [];
      }
      competenciesByCourse[competency.course_id].push(competency);
    });

    Object.values(competenciesByCourse).forEach((list) =>
      list.sort((a, b) => (a.order ?? a.order_index ?? 0) - (b.order ?? b.order_index ?? 0))
    );

    const sortedGrades = this.gradeLevels
      .slice()
      .sort((left, right) => {
        const levelDiff = (this.levelOrder[left.level] ?? 99) - (this.levelOrder[right.level] ?? 99);
        return levelDiff !== 0 ? levelDiff : left.grade - right.grade;
      });

    this.gradeGroups = sortedGrades.map((grade) => ({
      grade,
      expanded: this.expandedGrades[grade.id] ?? false,
      courses: this.courses
        .filter((course) => course.grade_level_id === grade.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((course) => ({
          course,
          competencies: competenciesByCourse[course.id] || [],
          expanded: this.expandedCourses[course.id] ?? false,
        })),
    }));

    // Si solo un grado tiene cursos, se expande automáticamente;
    // si no hay estado previo, se expande el primero con cursos.
    const gradesWithCourses = this.gradeGroups.filter((group) => group.courses.length > 0);
    const hasExpandedState = Object.keys(this.expandedGrades).length > 0;

    if (gradesWithCourses.length === 1) {
      gradesWithCourses[0].expanded = true;
      this.expandedGrades[gradesWithCourses[0].grade.id] = true;
    } else if (!hasExpandedState && gradesWithCourses.length > 0) {
      gradesWithCourses[0].expanded = true;
      this.expandedGrades[gradesWithCourses[0].grade.id] = true;
    }
  }

  // ── Acordeones ─────────────────────────────────────────────

  toggleGrade(group: GradeGroup): void {
    group.expanded = !group.expanded;
    this.expandedGrades[group.grade.id] = group.expanded;
  }

  toggleCourse(item: CourseWithCompetencies): void {
    item.expanded = !item.expanded;
    this.expandedCourses[item.course.id] = item.expanded;
  }

  toggleDescription(competency: Competency): void {
    this.expandedDescriptions[competency.id] = !this.expandedDescriptions[competency.id];
  }

  isDescriptionExpanded(competency: Competency): boolean {
    return !!this.expandedDescriptions[competency.id];
  }

  // ── Helpers de presentación ────────────────────────────────

  levelAccent(level: string): string {
    return this.levelMeta[level]?.accent || 'border-slate-400';
  }

  levelBadge(level: string): string {
    return this.levelMeta[level]?.badge || 'bg-gradient-to-br from-slate-500 to-slate-700';
  }

  levelChip(level: string): string {
    return this.levelMeta[level]?.chip || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  levelLabel(level: string): string {
    return this.levelMeta[level]?.label || level;
  }

  gradeCompetenciesCount(group: GradeGroup): number {
    return group.courses.reduce((sum, item) => sum + item.competencies.length, 0);
  }

  getCourseHours(course: Course): number {
    return course.hours_per_week ?? course.weekly_hours ?? 0;
  }

  // 4 competencias → completo según MINEDU
  competencyCountClass(count: number): string {
    if (count >= 4) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (count > 0) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-red-50 text-red-600 border-red-200';
  }

  competencyCountLabel(count: number): string {
    return count === 0 ? 'Sin competencias' : `${count} competencia(s)`;
  }

  // ── Cursos ─────────────────────────────────────────────────

  canDeleteCourse(item: CourseWithCompetencies): boolean {
    return item.competencies.length === 0;
  }

  courseDeleteTooltip(item: CourseWithCompetencies): string {
    return this.canDeleteCourse(item)
      ? 'Eliminar curso'
      : 'No puedes eliminar este curso porque tiene competencias registradas.';
  }

  openCourseModal(grade?: GradeLevel, course?: Course, event?: Event): void {
    event?.stopPropagation();
    this.isEditingCourse = !!course;

    if (course) {
      this.currentCourseEditId = course.id;
      this.courseForm.patchValue({
        grade_level_id: course.grade_level_id,
        name: course.name,
        code: course.code,
        hours_per_week: this.getCourseHours(course),
        color: course.color || '#2563EB',
      });
    } else {
      this.currentCourseEditId = null;
      this.courseForm.reset({
        grade_level_id: grade?.id || this.selectedGradeFilter || '',
        name: '',
        code: '',
        hours_per_week: 4,
        color: '#2563EB',
      });
    }

    this.courseForm.markAsPristine();
    this.courseForm.markAsUntouched();
    this.showCourseModal = true;
  }

  closeCourseModal(): void {
    this.showCourseModal = false;
    this.isEditingCourse = false;
    this.currentCourseEditId = null;
    this.courseSubmitting = false;
  }

  saveCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.courseSubmitting = true;
    const data = this.courseForm.value;

    const isUpdate = this.isEditingCourse && !!this.currentCourseEditId;
    const request$ = isUpdate
      ? this.academicService.updateCourse(this.currentCourseEditId!, data)
      : this.academicService.createCourse(data);

    request$.subscribe({
      next: () => {
        this.courseSubmitting = false;
        this.closeCourseModal();
        Swal.fire({
          icon: 'success',
          title: isUpdate ? 'Curso actualizado' : 'Curso registrado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        this.loadData();
      },
      error: (err) => {
        this.courseSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          html: this.resolveErrorHtml(err, 'Hubo un error al guardar el curso.'),
        });
      },
    });
  }

  deleteCourse(item: CourseWithCompetencies, event?: Event): void {
    event?.stopPropagation();

    if (!this.canDeleteCourse(item)) {
      Swal.fire('Acción no permitida', this.courseDeleteTooltip(item), 'info');
      return;
    }

    Swal.fire({
      title: '¿Eliminar curso?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deleteCourse(item.course.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          this.loadData();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo eliminar, revisa dependencias.', 'error');
        },
      });
    });
  }

  isCourseFieldInvalid(field: string): boolean {
    const ctrl = this.courseForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ── Competencias ───────────────────────────────────────────

  openCompetencyModal(course: Course, competency?: Competency, event?: Event): void {
    event?.stopPropagation();
    this.isEditingCompetency = !!competency;
    this.contextCourse = course;

    if (competency) {
      this.currentCompetencyEditId = competency.id;
      this.competencyForm.patchValue({
        course_id: competency.course_id,
        name: competency.name || '',
        description: competency.description,
        order: competency.order ?? competency.order_index ?? 1,
      });
    } else {
      this.currentCompetencyEditId = null;
      const existing = this.competencies.filter((c) => c.course_id === course.id);
      const nextOrder = existing.length
        ? Math.max(...existing.map((c) => c.order ?? c.order_index ?? 0)) + 1
        : 1;

      this.competencyForm.reset({
        course_id: course.id,
        name: '',
        description: '',
        order: nextOrder,
      });
    }

    this.competencyForm.markAsPristine();
    this.competencyForm.markAsUntouched();
    this.showCompetencyModal = true;
  }

  closeCompetencyModal(): void {
    this.showCompetencyModal = false;
    this.isEditingCompetency = false;
    this.currentCompetencyEditId = null;
    this.competencySubmitting = false;
    this.contextCourse = null;
  }

  contextCourseGradeName(): string {
    const gradeId = this.contextCourse?.grade_level_id;
    return this.gradeLevels.find((grade) => grade.id === gradeId)?.name || '';
  }

  saveCompetency(): void {
    if (this.competencyForm.invalid) {
      this.competencyForm.markAllAsTouched();
      return;
    }

    this.competencySubmitting = true;
    const data = this.competencyForm.value;

    const isUpdate = this.isEditingCompetency && !!this.currentCompetencyEditId;
    const request$ = isUpdate
      ? this.academicService.updateCompetency(this.currentCompetencyEditId!, data)
      : this.academicService.createCompetency(data);

    request$.subscribe({
      next: () => {
        this.competencySubmitting = false;
        this.closeCompetencyModal();
        Swal.fire({
          icon: 'success',
          title: isUpdate ? 'Competencia actualizada' : 'Competencia registrada',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        this.loadData();
      },
      error: (err) => {
        this.competencySubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          html: this.resolveErrorHtml(err, 'Hubo un error al guardar la competencia.'),
        });
      },
    });
  }

  deleteCompetency(competency: Competency, event?: Event): void {
    event?.stopPropagation();

    Swal.fire({
      title: '¿Eliminar competencia?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deleteCompetency(competency.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Eliminada', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          this.loadData();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo eliminar, revisa dependencias.', 'error');
        },
      });
    });
  }

  isCompetencyFieldInvalid(field: string): boolean {
    const ctrl = this.competencyForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ── Helpers ────────────────────────────────────────────────

  private resolveErrorHtml(err: any, fallback: string): string {
    const errors = err?.error?.errors;

    if (errors) {
      return Object.values(errors).flat().join('<br>');
    }

    return err?.error?.message || fallback;
  }

  private extractCollection<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }
}
