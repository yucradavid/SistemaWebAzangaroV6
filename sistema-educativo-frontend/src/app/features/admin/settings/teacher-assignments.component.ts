
//src/app/features/admin/settings/teacher-assignments.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { TeacherCourseAssignment, Course, Section, GradeLevel } from '@core/services/academic.service';
import { UserService, User } from '@core/services/user.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { AcademicService } from '@core/services/academic.service';
import { AcademicYear } from '@core/models/AcademicYear';
import { AuthService } from '@core/services/auth.service';
import { KpiBadgesComponent } from './kpi-badges.component';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent, KpiBadgesComponent],
  templateUrl: './teacher-assignments.component.html',
  styleUrl: './teacher-assignments.component.css'
})
export class TeacherAssignmentsComponent implements OnInit {
  teachers: User[] = [];
  courses: Course[] = [];
  sections: Section[] = [];
  academicYears: AcademicYear[] = [];
  assignments: TeacherCourseAssignment[] = [];
  gradeLevels: GradeLevel[] = [];
  gradeLevelsMap: { [id: string]: string } = {};
  academicYearsMap: { [id: string]: number } = {};
  gradeLevelById: { [id: string]: GradeLevel } = {};

  teacherGroups: { teacher: User, assignments: any[] }[] = [];
  filteredTeacherGroups: any[] = [];

  loading = false;
  showModal = false;
  isSubmitting = false;
  assignForm: FormGroup;

  maxCoursesPerTeacher = 6;
  existingTeacher: { teacher_id: string; teacher_name: string; assigned_at: string } | null = null;
  isAdminOrDirector = false;

  // Selector en cascada Nivel -> Grado -> Sección/Curso del modal "Nueva Asignación"
  selectedLevel = '';
  selectedGradeId = '';
  availableGrades: GradeLevel[] = [];
  availableSections: Section[] = [];
  availableCourses: Course[] = [];

  // Filtros del listado de docentes — combinables (multi-select), mantienen el
  // orden de seleccion. AND entre categorias distintas, OR dentro de la misma categoria.
  selectedLevels: string[] = [];
  selectedGradeIds: string[] = [];
  selectedSectionLetters: string[] = [];
  selectedTeacherIds: string[] = [];
  filterOverloadStatus = '';
  filterSearch = '';
  // Filtro EXCLUSIVO de sección (panel con acordeón, MEJORA 3) — distinto de
  // selectedSectionLetters: este reordena/auto-expande docentes (ver toggleSectionFilter),
  // los otros solo atenúan filas dentro de las cards ya visibles.
  filterSectionId = '';
  filteredGradeOptions: GradeLevel[] = [];
  availableSectionLetters: string[] = [];

  readonly levels = [
    { value: 'inicial', label: 'Inicial' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
  ];

  openDropdown: 'level' | 'grade' | 'section' | 'teacher' | null = null;
  sectionPanelOpen = false;
  expandedLevelAccordion: string | null = null;

  // Estado colapsado/expandido de las cards de docente. Solo en memoria del componente:
  // siempre inicia vacio (todas colapsadas) al entrar/recargar la pagina, y NO se guarda
  // en sessionStorage para evitar que sobreviva a un logout/login dentro de la misma pestaña.
  expandedTeacherIds = new Set<string>();

  // ---- Guardias temporales anti-loop (diagnostico) ----
  // Instrumentacion TEMPORAL: cuenta llamadas por funcion (+docente) dentro de una misma
  // interaccion del usuario. Si algo dispara un loop real, esto lanza un Error visible en
  // consola con el stack ANTES de que el hilo principal se congele silenciosamente, en vez
  // de dejar que el navegador se cuelgue sin pista alguna. NO quitar hasta confirmar la
  // causa raiz real del colgado reportado.
  private _loopGuardCounts = new Map<string, number>();

  private guardAgainstLoop(fnName: string, teacherId?: string): void {
    const key = fnName + (teacherId ? ':' + teacherId : '');
    const count = (this._loopGuardCounts.get(key) ?? 0) + 1;
    this._loopGuardCounts.set(key, count);

    if (count > 200) {
      const stack = new Error().stack;
      console.error(
        '🔴 LOOP DETECTADO en ' + fnName +
        (teacherId ? ' para docente ' + teacherId : '') +
        ': ' + count + ' llamadas. Stack:\n' + stack
      );
      throw new Error('LOOP_DETECTADO:' + fnName + ':' + count);
    }
  }

  private resetLoopGuards(): void {
    this._loopGuardCounts.clear();
  }

  // Filtros internos por docente (Grado/Seccion), aplican solo dentro de la card expandida
  teacherInternalGradeFilter: { [teacherId: string]: string } = {};
  teacherInternalSectionFilter: { [teacherId: string]: string } = {};

  private readonly SECTION_COLORS = [
    { bg: 'bg-cermat-blue-50', border: 'border-cermat-blue-300', text: 'text-cermat-blue-700', dot: 'bg-cermat-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', dot: 'bg-teal-500' },
    { bg: 'bg-lime-50', border: 'border-lime-300', text: 'text-lime-700', dot: 'bg-lime-500' },
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-300', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
    { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', dot: 'bg-sky-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  ];

  // Wizard de límite de cursos por docente
  showLimitModal = false;
  limitModalStep: 1 | 2 = 1;
  limitModalTeacher: any = null;
  limitUseGlobal = true;
  limitCustomValue: number | null = null;
  limitStep1Error = '';
  limitSubmitting = false;
  limitCurrentCount = 0;
  limitRequestedLimit = 0;
  coursesToReview: Array<{
    course_id: string;
    course_name: string;
    course_code: string;
    assignment_ids: string[];
    sections: { assignment_id: string; section_name: string; grade_name: string }[];
    action: 'keep' | 'remove' | 'reassign';
    newTeacherId: string;
  }> = [];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private userService: UserService,
    private authService: AuthService
  ) {
    // Note: backend expects `teacher_id` for teacher assignments (not `user_id`)
    this.assignForm = this.fb.group({
      teacher_id: ['', Validators.required],
      academic_year_id: ['', Validators.required],
      course_id: ['', Validators.required],
      section_id: ['', Validators.required]
    });
  }


  ngOnInit() {
    this.isAdminOrDirector = ['admin', 'director'].includes(this.authService.getRole() || '');
    // Estado explicito: todas las cards inician colapsadas y sin filtro de sección activo
    // cada vez que se entra a esta pantalla (no se restaura de sessionStorage ni de ningún otro lado).
    this.expandedTeacherIds = new Set();
    this.filterSectionId = '';
    this.updateColumnCount();
    this.loadInitialData();
    if (this.isAdminOrDirector) {
      this.loadMaxCoursesPerTeacher();
    }
  }

  // ---- Layout tipo masonry: columnas independientes en vez de CSS Grid ----
  // Con CSS Grid, colapsar/expandir una card no reacomoda a sus vecinas de fila
  // (la fila mantiene el alto de la card mas alta, dejando huecos). En su lugar,
  // distribuimos sortedTeacherGroups en N columnas independientes (flex), asignando
  // cada docente a la columna con MENOR peso acumulado (greedy bin-packing, igual
  // que Pinterest). No se mide el DOM real: se usa un peso ESTIMADO por card segun
  // su contenido (colapsada vs expandida, cantidad de cursos visibles, etc).
  columnCount = 3;

  @HostListener('window:resize')
  onResize(): void {
    this.updateColumnCount();
    this.recalculateAll();
  }

  private updateColumnCount(): void {
    const width = window.innerWidth;
    if (width < 768) this.columnCount = 1;
    else if (width < 1024) this.columnCount = 2;
    else this.columnCount = 3;
  }

  private calculateCardWeight(teacherGroup: { teacher: User; assignments: any[] }): number {
    this.guardAgainstLoop('calculateCardWeight', teacherGroup.teacher.id);
    const HEADER_WEIGHT = 2;      // nombre + resumen + fila de limite
    const FILTERS_ROW_WEIGHT = 1; // selects internos de grado/seccion
    const COURSE_ROW_WEIGHT = 1.2; // cada curso visible dentro de la card expandida
    const ADD_BUTTON_WEIGHT = 0.8; // boton "Agregar curso a este docente"

    let weight = HEADER_WEIGHT;

    if (!this.isTeacherExpanded(teacherGroup.teacher.id)) {
      return weight; // colapsada: solo el header
    }

    if (this.getSectionsInUse(teacherGroup).length > 1) {
      weight += FILTERS_ROW_WEIGHT;
    }

    const visibleCourses = this.getFilteredAssignments(teacherGroup);
    weight += Math.max(visibleCourses.length, 1) * COURSE_ROW_WEIGHT;
    weight += ADD_BUTTON_WEIGHT;

    return weight;
  }

  // IMPORTANTE: teacherColumns NO es un getter. Un getter que arma un array-de-arrays
  // nuevo en cada ciclo de change detection, consumido por un *ngFor sin trackBy, hace
  // que Angular destruya y reconstruya el DOM de TODAS las cards en cada tick (no solo
  // re-vincule datos) — eso fue lo que causaba el cuelgue al hacer click en los filtros
  // de sección (que ademas auto-expanden varias cards a la vez). En su lugar, es una
  // propiedad cacheada que solo se recalcula explicitamente cuando algo relevante
  // cambia de verdad (ver recalculateColumns() y sus puntos de llamada).
  teacherColumnsCache: any[][] = [];

  recalculateColumns(): void {
    const columns: any[][] = Array.from({ length: this.columnCount }, () => []);
    const columnWeights: number[] = new Array(this.columnCount).fill(0);

    for (const teacherGroup of this.sortedTeacherGroups) {
      let minIndex = 0;
      for (let i = 1; i < this.columnCount; i++) {
        if (columnWeights[i] < columnWeights[minIndex]) {
          minIndex = i;
        }
      }
      columns[minIndex].push(teacherGroup);
      columnWeights[minIndex] += this.calculateCardWeight(teacherGroup);
    }

    this.teacherColumnsCache = columns;
  }

  // KPIs del header (Total docentes / Carga total / Cerca del límite / En el límite).
  // Mismo problema que teacherColumns: nearLimitCount()/atLimitCount() eran metodos
  // llamados directamente en el template ({{ nearLimitCount() }}), y totalTeachers/
  // totalAssignments eran getters ({{ totalTeachers }}) — ambas formas se re-evaluan
  // en CADA ciclo de change detection igual que un getter. nearLimitCount/atLimitCount
  // ademas iteraban TODOS los docentes llamando a distinctCourseCount() en cada
  // evaluacion — exactamente el mismo patron que causo el cuelgue de teacherColumns.
  // Ahora son propiedades cacheadas, recalculadas solo cuando algo relevante cambia.
  totalTeachersCache = 0;
  totalAssignmentsCache = 0;
  nearLimitCountCache = 0;
  atLimitCountCache = 0;

  private recalculateKpis(): void {
    this.totalTeachersCache = this.teachers.length;
    this.totalAssignmentsCache = this.assignments.length;
    // Misma logica exacta que los metodos anteriores (no se cambio ningun umbral):
    // "cerca del limite" incluye a quien ya esta en el limite (count >= limit - 1).
    this.nearLimitCountCache = this.teacherGroups.filter(g => this.distinctCourseCount(g) >= this.effectiveLimit(g.teacher) - 1).length;
    this.atLimitCountCache = this.teacherGroups.filter(g => this.distinctCourseCount(g) === this.effectiveLimit(g.teacher)).length;
  }

  // Punto unico de recalculo: columnas (masonry) y KPIs dependen del mismo estado base
  // (teacherGroups/filteredTeacherGroups), asi que siempre se recalculan juntos para
  // no olvidar ninguno en un punto de llamada nuevo.
  recalculateAll(): void {
    this.recalculateColumns();
    this.recalculateKpis();
  }

  // trackBy para los *ngFor de columnas/cards/cursos: aunque los arrays cambien de
  // referencia (recalculateColumns crea arrays nuevos), Angular reutiliza el DOM
  // existente en vez de destruir y reconstruir todo, mientras la clave (id) no cambie.
  trackByColumnIndex(index: number): number {
    return index;
  }

  trackByTeacherId(_index: number, teacherGroup: { teacher: User }): string {
    return teacherGroup.teacher.id;
  }

  trackByAssignmentId(_index: number, item: { id: string }): string {
    return item.id;
  }

  loadMaxCoursesPerTeacher() {
    this.academicService.getMaxCoursesPerTeacher().subscribe({
      next: (res: any) => { this.maxCoursesPerTeacher = res?.value ?? 6; },
      error: () => { /* deja el valor por defecto (6) si el usuario no tiene rol admin/director */ }
    });
  }

  loadInitialData() {
    this.loading = true;
    console.log('Iniciando carga de datos...');
    const startTime = performance.now();

    forkJoin({
      teachers: this.academicService.getTeachers({ per_page: 200, simple: true }),
      courses: this.academicService.getCourses({ per_page: 200, simple: true }),
      sections: this.academicService.getSections({ per_page: 200, simple: true }),
      academicYears: this.academicService.getAcademicYears({ per_page: 50, simple: true }),
      assignments: this.academicService.getTeacherCourseAssignments({ per_page: 200, simple: true }),
      grades: this.academicService.getGradeLevels({ per_page: 200, simple: true })
    }).subscribe({
      next: (res: any) => {
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`Carga de datos completada en ${elapsed}ms`);
        console.log('Datos cargados:', res);

        const teacherData: any[] = res.teachers?.data || res.teachers || [];
        // Normalize teacher shape so template (name/last_name) works
        this.teachers = Array.isArray(teacherData)
          ? teacherData.map(t => ({ ...t, name: t.first_name || t.name, last_name: t.last_name || '' }))
          : [];

        this.courses = res.courses.data || res.courses;
        this.sections = res.sections.data || res.sections;
        this.academicYears = res.academicYears.data || res.academicYears;
        this.academicYearsMap = {};
        this.academicYears.forEach((ay: any) => { this.academicYearsMap[ay.id] = ay.year; });
        this.assignments = res.assignments.data || res.assignments;

        console.log('Docentes:', this.teachers.length, this.teachers);
        console.log('Cursos:', this.courses.length, this.courses);
        console.log('Secciones:', this.sections.length, this.sections);
        console.log('Años académicos:', this.academicYears.length, this.academicYears);
        console.log('Asignaciones:', this.assignments.length, this.assignments);

        const grades = res.grades.data || res.grades;
        this.gradeLevels = grades;
        this.gradeLevelById = {};
        grades.forEach((g: any) => {
          this.gradeLevelsMap[g.id] = g.name;
          this.gradeLevelById[g.id] = g;
        });

        console.log('Niveles de grado:', grades.length, grades);

        this.processGroups();
        this.loading = false;
      },
      error: (err) => {
        console.log('Error al cargar datos:', err);
        this.loading = false;
      }
    });
  }
  distinctCourseCount(teacherGroup: { assignments: any[] }): number {
    this.guardAgainstLoop('distinctCourseCount');
    const courseIds = new Set(teacherGroup.assignments.map(a => a.course?.id).filter(Boolean));
    return courseIds.size;
  }

  effectiveLimit(teacher: any): number {
    return teacher?.max_courses_override ?? this.maxCoursesPerTeacher;
  }

  openTeacherLimitModal(teacher: any) {
    this.limitModalTeacher = teacher;
    this.limitModalStep = 1;
    this.limitUseGlobal = teacher.max_courses_override == null;
    this.limitCustomValue = teacher.max_courses_override ?? null;
    this.limitStep1Error = '';
    this.coursesToReview = [];
    this.showLimitModal = true;
  }

  closeLimitModal() {
    this.showLimitModal = false;
    this.limitModalTeacher = null;
    this.limitModalStep = 1;
    this.coursesToReview = [];
    this.limitSubmitting = false;
  }

  submitLimitStep1() {
    this.limitStep1Error = '';

    if (!this.limitUseGlobal && (!this.limitCustomValue || this.limitCustomValue < 1)) {
      this.limitStep1Error = 'Ingresa un límite válido (mayor a 0)';
      return;
    }

    const value = this.limitUseGlobal ? null : Number(this.limitCustomValue);
    this.updateTeacherCourseOverride(this.limitModalTeacher.id, value);
  }

  sectionNames(course: { sections: { section_name: string }[] }): string {
    return course.sections.map(s => s.section_name).join(', ');
  }

  availableTeachersFor(teacher: any): any[] {
    return this.teachers.filter(t => t.id !== teacher?.id);
  }

  remainingAfterChanges(): number {
    return this.coursesToReview.filter(c => c.action === 'keep').length;
  }

  hasUnresolvedReassignments(): boolean {
    return this.coursesToReview.some(c => c.action === 'reassign' && !c.newTeacherId);
  }

  confirmLimitChange() {
    if (this.remainingAfterChanges() > this.limitRequestedLimit || this.hasUnresolvedReassignments()) return;

    const removeCourseIds = this.coursesToReview
      .filter(c => c.action === 'remove')
      .map(c => c.course_id);

    const reassignments = this.coursesToReview
      .filter(c => c.action === 'reassign')
      .flatMap(c => c.assignment_ids.map(assignmentId => ({ assignment_id: assignmentId, new_teacher_id: c.newTeacherId })));

    const value = this.limitUseGlobal ? null : Number(this.limitCustomValue);

    this.limitSubmitting = true;
    this.academicService.confirmTeacherMaxCoursesOverride(this.limitModalTeacher.id, {
      max_courses_override: value,
      remove_course_ids: removeCourseIds,
      reassignments
    }).subscribe({
      next: () => {
        this.limitSubmitting = false;
        this.closeLimitModal();
        Swal.fire({
          icon: 'success', title: 'Cursos ajustados y límite actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
        this.loadInitialData();
      },
      error: (err) => {
        this.limitSubmitting = false;

        if (err.status === 409 && err.error?.error_code === 'EXCEEDS_NEW_LIMIT') {
          // Los cursos cambiaron mientras el admin decidia; recargar el paso 2 con datos frescos.
          this.limitCurrentCount = err.error.current_count;
          this.limitRequestedLimit = err.error.requested_limit;
          this.coursesToReview = (err.error.courses_to_review || []).map((c: any) => ({ ...c, action: 'keep', newTeacherId: '' }));
          Swal.fire('Los cursos cambiaron', 'Revisa la lista actualizada antes de confirmar.', 'warning');
          return;
        }

        if (err.error?.error_code === 'TEACHER_COURSE_LIMIT') {
          Swal.fire('No se pudo reasignar', 'El docente destino ya alcanzó su propio límite de cursos.', 'warning');
          return;
        }

        Swal.fire('Error', err.error?.message || 'No se pudieron aplicar los cambios', 'error');
      }
    });
  }

  private updateTeacherCourseOverride(teacherId: string, value: number | null) {
    this.limitSubmitting = true;
    this.academicService.updateTeacherMaxCoursesOverride(teacherId, value).subscribe({
      next: () => {
        this.limitSubmitting = false;
        this.closeLimitModal();
        Swal.fire({
          icon: 'success', title: 'Límite del docente actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
        this.loadInitialData();
      },
      error: (err) => {
        this.limitSubmitting = false;

        if (err.status === 409 && err.error?.error_code === 'EXCEEDS_NEW_LIMIT') {
          if (!this.limitModalTeacher || this.limitModalTeacher.id !== teacherId) {
            this.limitModalTeacher = this.teachers.find((t: any) => t.id === teacherId) || null;
          }
          this.limitCurrentCount = err.error.current_count;
          this.limitRequestedLimit = err.error.requested_limit;
          this.limitUseGlobal = value === null;
          this.limitCustomValue = value;
          this.coursesToReview = (err.error.courses_to_review || []).map((c: any) => ({ ...c, action: 'keep', newTeacherId: '' }));
          this.limitModalStep = 2;
          this.showLimitModal = true;
          return;
        }

        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el límite del docente', 'error');
      }
    });
  }

  getSectionDisplayName(sec: any): string {
    if (!sec) return 'Sección desconocida';
    const gradeName = this.gradeLevelsMap[sec.grade_level_id] || 'Grado';
    const letter = sec.section_letter || sec.letter || '';
    const year = this.academicYearsMap[sec.academic_year_id];
    return year ? `${gradeName} - Sección ${letter} (${year})` : `${gradeName} - Sección ${letter}`;
  }

  // Solo muestra las secciones del año académico elegido en el formulario,
  // para no mezclar secciones de distintos años bajo el mismo nombre/letra.
  onAssignYearChange() {
    // El filtro por año ya existente sigue mandando: si cambia el año,
    // la sección deja de ser valida para ese año y se resetea junto al curso.
    this.assignForm.patchValue({ section_id: '', course_id: '' });

    if (this.selectedGradeId) {
      this.recalculateAvailableSections();
    } else {
      this.availableSections = [];
    }

    this.checkExistingTeacher();
  }

  onLevelChange() {
    this.selectedGradeId = '';
    this.assignForm.patchValue({ section_id: '', course_id: '' });
    this.availableGrades = this.gradeLevels.filter(g => g.level === this.selectedLevel);
    this.availableSections = [];
    this.availableCourses = [];
    this.existingTeacher = null;
  }

  onGradeChange() {
    this.assignForm.patchValue({ section_id: '', course_id: '' });
    this.existingTeacher = null;

    this.recalculateAvailableSections();
    this.availableCourses = this.courses.filter(c => c.grade_level_id === this.selectedGradeId);
  }

  private recalculateAvailableSections() {
    const yearId = this.assignForm.value.academic_year_id;
    this.availableSections = this.sections.filter(s =>
      s.grade_level_id === this.selectedGradeId &&
      (!yearId || s.academic_year_id === yearId)
    );
  }

  processGroups() {
    // Ensure we use the right teacher key (backend uses teacher_id)
    const sample = this.assignments?.[0];
    if (sample) {
      console.log('Sample assignment record:', sample);
    }

    this.teacherGroups = this.teachers.map(teacher => {
      // Find all assignments for this teacher
      const teacherAssignments = this.assignments
        .filter(a => (a as any).teacher_id === teacher.id || (a as any).user_id === teacher.id)
        .map((a: any) => {
          const course = this.courses.find(c => c.id === a.course_id);
          const section = this.sections.find(s => s.id === a.section_id);
          const academicYear = this.academicYears.find(ay => ay.id === a.academic_year_id);

          return {
            id: a.id,
            course,
            section,
            academicYear
          };
        });

      return { teacher, assignments: teacherAssignments };
    });

    console.log('Teacher groups processed:', this.teacherGroups);

    this.applyFilters();
  }

  // ---- Filtros ----

  applyFilters() {
    this.resetLoopGuards();
    this.recomputeGradeOptions();
    this.recomputeAvailableSectionLetters();

    let list = [...this.teacherGroups];

    if (this.filterSearch) {
      const term = this.filterSearch.toLowerCase();
      list = list.filter(g =>
        g.teacher.name?.toLowerCase().includes(term) || (g.teacher as any).last_name?.toLowerCase().includes(term)
      );
    }

    if (this.filterOverloadStatus) {
      list = list.filter(g => {
        const limit = this.effectiveLimit(g.teacher);
        const count = this.distinctCourseCount(g);
        if (this.filterOverloadStatus === 'near_limit') return count >= limit - 1;
        if (this.filterOverloadStatus === 'at_limit') return count === limit;
        if (this.filterOverloadStatus === 'has_override') return (g.teacher as any).max_courses_override != null;
        return true;
      });
    }

    if (this.selectedTeacherIds.length > 0) {
      list = list.filter(g => this.selectedTeacherIds.includes(g.teacher.id));
    }

    this.filteredTeacherGroups = list;
    this.recalculateAll();
  }

  // ---- Filtros combinables (multi-select) de nivel/grado/sección/docente ----

  private toggleInArray(arr: string[], value: string): void {
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value); else arr.splice(idx, 1);
  }

  toggleDropdown(name: 'level' | 'grade' | 'section' | 'teacher'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  toggleLevelSelection(value: string): void {
    this.toggleInArray(this.selectedLevels, value);
    this.applyFilters();
  }

  toggleGradeSelection(value: string): void {
    this.toggleInArray(this.selectedGradeIds, value);
    this.applyFilters();
  }

  toggleSectionLetterSelection(value: string): void {
    this.toggleInArray(this.selectedSectionLetters, value);
    this.applyFilters();
  }

  toggleTeacherSelection(value: string): void {
    this.toggleInArray(this.selectedTeacherIds, value);
    this.applyFilters();
  }

  getLevelLabel(value: string): string {
    return this.levels.find(l => l.value === value)?.label || value;
  }

  getGradeLabel(value: string): string {
    return this.gradeLevelsMap[value] || value;
  }

  getSectionLetterLabel(value: string): string {
    return 'Sección ' + value;
  }

  getTeacherLabel(value: string): string {
    const t = this.teachers.find(t => t.id === value) as any;
    return t ? `${t.name} ${t.last_name}` : value;
  }

  // Chips en el orden REAL de seleccion: primero los niveles agregados (en el orden
  // en que se marcaron), luego grados, luego secciones, luego docentes.
  activeFilterChips(): { type: 'level' | 'grade' | 'section' | 'teacher'; value: string; label: string }[] {
    const chips: { type: 'level' | 'grade' | 'section' | 'teacher'; value: string; label: string }[] = [];
    this.selectedLevels.forEach(v => chips.push({ type: 'level', value: v, label: this.getLevelLabel(v) }));
    this.selectedGradeIds.forEach(v => chips.push({ type: 'grade', value: v, label: this.getGradeLabel(v) }));
    this.selectedSectionLetters.forEach(v => chips.push({ type: 'section', value: v, label: this.getSectionLetterLabel(v) }));
    this.selectedTeacherIds.forEach(v => chips.push({ type: 'teacher', value: v, label: this.getTeacherLabel(v) }));
    return chips;
  }

  removeFilterChip(chip: { type: string; value: string }): void {
    if (chip.type === 'level') this.toggleInArray(this.selectedLevels, chip.value);
    else if (chip.type === 'grade') this.toggleInArray(this.selectedGradeIds, chip.value);
    else if (chip.type === 'section') this.toggleInArray(this.selectedSectionLetters, chip.value);
    else if (chip.type === 'teacher') this.toggleInArray(this.selectedTeacherIds, chip.value);
    this.applyFilters();
  }

  // Cierra cualquier dropdown/panel abierto al hacer click fuera de el.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-filter-dropdown]')) {
      this.openDropdown = null;
      this.sectionPanelOpen = false;
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedLevels.length > 0 || this.selectedGradeIds.length > 0 ||
      this.selectedSectionLetters.length > 0 || this.selectedTeacherIds.length > 0 ||
      !!this.filterOverloadStatus || !!this.filterSearch || !!this.filterSectionId;
  }

  clearFilters() {
    this.selectedLevels = [];
    this.selectedGradeIds = [];
    this.selectedSectionLetters = [];
    this.selectedTeacherIds = [];
    this.filterOverloadStatus = '';
    this.filterSearch = '';
    this.filterSectionId = '';
    // Reset explicito: antes, limpiar filtros no tocaba expandedTeacherIds, asi que un
    // docente auto-expandido por un filtro de sección anterior (ver toggleSectionFilter)
    // seguia expandido despues de "Limpiar filtros" — parecia un auto-expand fantasma.
    // Ahora limpiar filtros SIEMPRE colapsa todo, sin excepcion.
    this.expandedTeacherIds = new Set();
    this.applyFilters();
  }

  toggleSectionFilter(sectionId: string) {
    this.resetLoopGuards();
    const activating = this.filterSectionId !== sectionId;
    this.filterSectionId = activating ? sectionId : '';
    this.applyFilters();

    // Al activar un filtro de sección, auto-expandir a los docentes que coinciden
    // para que el admin vea sus cursos de inmediato. Al desactivar, no forzar colapso.
    if (activating) {
      for (const group of this.teacherGroups) {
        if (this.teacherHasSectionMatch(group)) {
          this.expandedTeacherIds.add(group.teacher.id);
        }
      }
      // Recalcular de nuevo: applyFilters() ya recalculo columnas/KPIs arriba, pero el
      // peso de las cards recien auto-expandidas solo es correcto despues de este bucle.
      this.recalculateAll();
    }
  }

  clearSectionFilter() {
    this.filterSectionId = '';
    this.applyFilters();
  }

  // ---- Panel de sección con acordeón por nivel (MEJORA 3) ----
  // Presentacion visual unicamente: envuelve toggleSectionFilter()/clearSectionFilter()
  // ya existentes, sin cambiar su comportamiento (auto-expand, reordenamiento, etc).

  toggleSectionPanel(): void {
    this.sectionPanelOpen = !this.sectionPanelOpen;
  }

  toggleLevelAccordion(level: string): void {
    this.expandedLevelAccordion = this.expandedLevelAccordion === level ? null : level;
  }

  getSectionsForLevel(level: string): { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }[] {
    return this.getVisibleSectionsLegend().filter(sec => this.gradeLevelById[sec.grade_level_id]?.level === level);
  }

  selectSectionFilter(sectionId: string): void {
    this.toggleSectionFilter(sectionId);
    this.sectionPanelOpen = false;
  }

  getSelectedSectionLabel(): string {
    const sec = this.getVisibleSectionsLegend().find(s => s.id === this.filterSectionId);
    return sec ? `${sec.grade_name} - ${sec.section_name}` : '';
  }

  trackBySectionId(_index: number, sec: { id: string }): string {
    return sec.id;
  }

  teacherHasSectionMatch(teacherGroup: { assignments: any[] }): boolean {
    this.guardAgainstLoop('teacherHasSectionMatch');
    if (!this.filterSectionId) return false;
    return teacherGroup.assignments.some(item => item.section?.id === this.filterSectionId);
  }

  // Reordena (sin mutar datos ni llamar al backend) priorizando a los docentes
  // que coinciden con el filtro de sección activo; sin filtro, mantiene el orden normal.
  get sortedTeacherGroups(): any[] {
    if (!this.filterSectionId) return this.filteredTeacherGroups;

    const withMatch: any[] = [];
    const withoutMatch: any[] = [];

    for (const group of this.filteredTeacherGroups) {
      (this.teacherHasSectionMatch(group) ? withMatch : withoutMatch).push(group);
    }

    return [...withMatch, ...withoutMatch];
  }

  private recomputeGradeOptions() {
    this.filteredGradeOptions = this.selectedLevels.length > 0
      ? this.gradeLevels.filter(g => this.selectedLevels.includes(g.level))
      : this.gradeLevels;

    // Poda selecciones de grado que ya no son validas para los niveles elegidos,
    // en vez de vaciar todo — preserva lo que el usuario ya marco y aun aplica.
    this.selectedGradeIds = this.selectedGradeIds.filter(id => this.filteredGradeOptions.some(g => g.id === id));
  }

  private recomputeAvailableSectionLetters() {
    let scoped = this.sections;
    if (this.selectedGradeIds.length > 0) {
      scoped = scoped.filter(s => this.selectedGradeIds.includes(s.grade_level_id));
    } else if (this.selectedLevels.length > 0) {
      scoped = scoped.filter(s => this.selectedLevels.includes(this.gradeLevelById[s.grade_level_id]?.level));
    }

    const letters = new Set(scoped.map(s => s.section_letter).filter((l): l is string => !!l));
    this.availableSectionLetters = Array.from(letters).sort();

    this.selectedSectionLetters = this.selectedSectionLetters.filter(l => this.availableSectionLetters.includes(l));
  }

  // Solo se aplica dimming cuando algun filtro de nivel/grado/seccion esta activo;
  // los filtros de busqueda/estado de limite/docente ya ocultan la card completa.
  isAssignmentDimmed(item: any): boolean {
    if (!this.selectedLevels.length && !this.selectedGradeIds.length && !this.selectedSectionLetters.length) return false;
    return !this.assignmentMatchesFilters(item);
  }

  // AND entre categorias (nivel Y grado Y sección), OR dentro de la misma categoria
  // (ej. nivel="primaria" O nivel="secundaria" si ambos estan marcados).
  private assignmentMatchesFilters(item: any): boolean {
    const gradeId = item.section?.grade_level_id;

    if (this.selectedLevels.length && !this.selectedLevels.includes(this.gradeLevelById[gradeId]?.level)) return false;
    if (this.selectedGradeIds.length && !this.selectedGradeIds.includes(gradeId)) return false;
    if (this.selectedSectionLetters.length && !this.selectedSectionLetters.includes(item.section?.section_letter)) return false;

    return true;
  }


  // ---- Expandir / colapsar cards de docente ----

  isTeacherExpanded(teacherId: string): boolean {
    return this.expandedTeacherIds.has(teacherId);
  }

  toggleTeacherExpanded(teacherId: string) {
    this.resetLoopGuards();
    if (this.expandedTeacherIds.has(teacherId)) {
      this.expandedTeacherIds.delete(teacherId);
    } else {
      this.expandedTeacherIds.add(teacherId);
    }
    this.recalculateAll();
  }

  areAllExpanded(): boolean {
    return this.filteredTeacherGroups.length > 0 &&
      this.filteredTeacherGroups.every(g => this.expandedTeacherIds.has(g.teacher.id));
  }

  toggleExpandAll() {
    this.resetLoopGuards();
    if (this.areAllExpanded()) {
      this.filteredTeacherGroups.forEach(g => this.expandedTeacherIds.delete(g.teacher.id));
    } else {
      this.filteredTeacherGroups.forEach(g => this.expandedTeacherIds.add(g.teacher.id));
    }
    this.recalculateAll();
  }

  // ---- Filtros internos por docente + capacidad de sección ----

  getGradesInUse(teacherGroup: { assignments: any[] }): { id: string; name: string }[] {
    this.guardAgainstLoop('getGradesInUse');
    const seen = new Map<string, { id: string; name: string }>();
    for (const item of teacherGroup.assignments) {
      const gradeId = item.section?.grade_level_id;
      if (!gradeId || seen.has(gradeId)) continue;
      seen.set(gradeId, { id: gradeId, name: this.gradeLevelsMap[gradeId] || 'Grado' });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getSectionsInUse(teacherGroup: { assignments: any[] }): { id: string; letter: string }[] {
    this.guardAgainstLoop('getSectionsInUse');
    const seen = new Map<string, { id: string; letter: string }>();
    for (const item of teacherGroup.assignments) {
      const sec = item.section;
      if (!sec?.id || seen.has(sec.id)) continue;
      seen.set(sec.id, { id: sec.id, letter: sec.section_letter || sec.letter || '' });
    }
    return Array.from(seen.values()).sort((a, b) => a.letter.localeCompare(b.letter));
  }

  // Combina (AND) el filtro global exclusivo de la leyenda (filterSectionId, oculta filas)
  // con los filtros internos de Grado/Sección de esta card especifica.
  getFilteredAssignments(teacherGroup: { teacher: User; assignments: any[] }): any[] {
    this.guardAgainstLoop('getFilteredAssignments', teacherGroup.teacher.id);
    const gradeFilter = this.teacherInternalGradeFilter[teacherGroup.teacher.id];
    const sectionFilter = this.teacherInternalSectionFilter[teacherGroup.teacher.id];

    return teacherGroup.assignments.filter(item => {
      if (this.filterSectionId && item.section?.id !== this.filterSectionId) return false;
      if (gradeFilter && item.section?.grade_level_id !== gradeFilter) return false;
      if (sectionFilter && item.section?.id !== sectionFilter) return false;
      return true;
    });
  }

  occupancyPct(section: any): number {
    if (!section?.capacity) return 0;
    return Math.round(((section.students_count ?? 0) / section.capacity) * 100);
  }

  // ---- Colores por sección ----

  // El color se deriva de grado+letra (no del id de seccion) para que la misma
  // combinacion (ej. "1ro - A") sea visualmente identificable independientemente
  // del año academico, y para que grados distintos con la misma letra no colisionen.
  getSectionColor(gradeLevelId?: string, sectionLetter?: string) {
    const key = `${gradeLevelId || ''}::${sectionLetter || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.SECTION_COLORS.length;
    return this.SECTION_COLORS[index];
  }

  getVisibleSectionsLegend(): { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }[] {
    this.guardAgainstLoop('getVisibleSectionsLegend');
    const seen = new Map<string, { id: string; grade_name: string; section_name: string; grade_level_id: string; section_letter: string; year: number | string }>();

    for (const group of this.filteredTeacherGroups) {
      for (const item of group.assignments) {
        const sec = item.section;
        if (!sec?.id || seen.has(sec.id)) continue;

        seen.set(sec.id, {
          id: sec.id,
          grade_name: this.gradeLevelsMap[sec.grade_level_id] || 'Grado',
          section_name: sec.section_letter || sec.letter || '',
          grade_level_id: sec.grade_level_id,
          section_letter: sec.section_letter || sec.letter || '',
          year: this.academicYearsMap[sec.academic_year_id] || ''
        });
      }
    }

    return Array.from(seen.values()).sort((a, b) => (a.grade_name + a.section_name).localeCompare(b.grade_name + b.section_name));
  }

  openModal(preselectedTeacherId?: string) {
    this.assignForm.reset({
      teacher_id: preselectedTeacherId || '',
      academic_year_id: this.academicYears.length > 0 ? this.academicYears[0].id : '',
      course_id: '',
      section_id: ''
    });
    this.existingTeacher = null;
    this.selectedLevel = '';
    this.selectedGradeId = '';
    this.availableGrades = [];
    this.availableSections = [];
    this.availableCourses = [];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  checkExistingTeacher() {
    const { course_id, section_id, academic_year_id } = this.assignForm.value;
    this.existingTeacher = null;
    if (!course_id || !section_id || !academic_year_id) return;

    this.academicService.getAssignedTeachersByCourseSection({ course_id, section_id, academic_year_id }).subscribe({
      next: (res: any) => {
        const assigned = res?.assigned_teachers || [];
        this.existingTeacher = assigned.length > 0 ? assigned[0] : null;
      },
      error: () => { this.existingTeacher = null; }
    });
  }

  saveAssignment() {
    if (this.assignForm.invalid) return;
    this.isSubmitting = true;

    const payload = {
      ...this.assignForm.value,
      // Backend expects teacher_id, not user_id
      teacher_id: (this.assignForm.value as any).teacher_id || (this.assignForm.value as any).user_id
    };

    this.academicService.checkScheduleConflict(payload).subscribe({
      next: (res: any) => {
        if (res?.has_conflict) {
          this.isSubmitting = false;
          this.handleScheduleConflict(res, payload);
        } else {
          this.proceedCreate(payload);
        }
      },
      error: (err) => {
        // La verificación de cruce es un apoyo preventivo; si falla (ej. red),
        // no bloquea la creación de la asignación.
        console.warn('No se pudo verificar cruce de horario, continuando:', err);
        this.proceedCreate(payload);
      }
    });
  }

  private handleScheduleConflict(conflictRes: any, payload: any) {
    const conflict = conflictRes.conflicting_with?.[0];
    const suggestions: any[] = conflictRes.suggestions || [];

    Swal.fire({
      icon: 'warning',
      title: 'Cruce de horario detectado',
      html: `El docente ya tiene clase en ese horario:
        <br><b>${conflict?.course_name || ''}</b>
        (${conflict?.day || ''} ${conflict?.time || ''})<br><br>
        ${suggestions.length > 0
          ? 'Secciones alternativas disponibles:'
          : 'No hay secciones alternativas libres para este docente en este curso.'}`,
      showCancelButton: suggestions.length > 0,
      confirmButtonText: suggestions.length > 0 ? 'Ver alternativas' : 'Entendido',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && suggestions.length > 0) {
        this.openSuggestionsModal(suggestions, payload);
      }
    });
  }

  private openSuggestionsModal(suggestions: any[], payload: any) {
    Swal.fire({
      title: 'Secciones alternativas',
      input: 'select',
      inputOptions: suggestions.reduce((acc: any, s: any) => {
        acc[s.section_id] = `${s.section_name} · ${s.day} ${s.time}`;
        return acc;
      }, {}),
      inputPlaceholder: 'Selecciona una sección disponible',
      showCancelButton: true,
      confirmButtonText: 'Asignar en esta sección',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.proceedCreate({ ...payload, section_id: result.value });
      }
    });
  }

  private proceedCreate(payload: any) {
    this.isSubmitting = true;
    console.log('Enviando asignación al backend:', payload);

    this.academicService.createTeacherCourseAssignment(payload).subscribe({
      next: (res) => {
        console.log('Respuesta creación asignación:', res);
        this.isSubmitting = false;
        this.closeModal();
        Swal.fire({
          icon: 'success', title: 'Asignación creada', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });

        // Reload all data to ensure references are fresh
        this.loadInitialData();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al crear asignación:', err);

        if (err.error?.error_code === 'TEACHER_COURSE_LIMIT') {
          this.handleTeacherCourseLimitError(err.error, payload);
          return;
        }

        Swal.fire('Error', err.error?.message || 'Error al asignar curso', 'error');
      }
    });
  }

  private handleTeacherCourseLimitError(error: { current: number; max: number }, payload: any) {
    Swal.fire({
      icon: 'info',
      title: '📚 Demasiados cursos asignados',
      html: `Este docente ya tiene <b>${error.current}</b>
        cursos asignados (máximo actual: <b>${error.max}</b>).<br><br>
        ${this.isAdminOrDirector ? '¿Deseas aumentar el límite de cursos permitidos?' : 'Contacta a un administrador o director para ajustar el límite.'}`,
      showCancelButton: this.isAdminOrDirector,
      confirmButtonText: this.isAdminOrDirector ? 'Aumentar límite' : 'Entendido',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.isAdminOrDirector) {
        this.promptLimitScopeChoice(error.max, payload.teacher_id);
      }
    });
  }

  private promptLimitScopeChoice(currentMax: number, teacherId: string) {
    const teacher = this.teachers.find(t => t.id === teacherId) as any;
    const teacherName = teacher ? `${teacher.name} ${teacher.last_name}` : 'este docente';

    Swal.fire({
      icon: 'question',
      title: '¿Para quién aumentar el límite?',
      html: `Puedes subir el límite solo para <b>${teacherName}</b>,
        o cambiar el límite global (afecta a todos los docentes sin límite personalizado).`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Solo este docente',
      denyButtonText: 'Todos los docentes',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.promptIncreaseLimit(currentMax, teacherId);
      } else if (result.isDenied) {
        this.promptIncreaseLimit(currentMax, null);
      }
    });
  }

  private promptIncreaseLimit(currentMax: number, teacherId: string | null) {
    Swal.fire({
      title: teacherId ? 'Nuevo límite para este docente' : 'Nuevo límite global de cursos por docente',
      input: 'number',
      inputValue: currentMax + 1,
      inputAttributes: { min: '1', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || Number(value) < 1) {
          return 'El límite debe ser mayor a 0';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        if (teacherId) {
          this.updateTeacherCourseOverride(teacherId, Number(result.value));
        } else {
          this.updateMaxCoursesPerTeacher(Number(result.value));
        }
      }
    });
  }

  openLimitPrompt() {
    this.promptIncreaseLimit(this.maxCoursesPerTeacher, null);
  }

  private updateMaxCoursesPerTeacher(value: number) {
    this.academicService.updateMaxCoursesPerTeacher(value).subscribe({
      next: (res: any) => {
        this.maxCoursesPerTeacher = res?.value ?? value;
        Swal.fire({
          icon: 'success', title: 'Límite actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el límite', 'error');
      }
    });
  }

  deleteAssignment(id: string) {
    Swal.fire({
      title: '¿Quitar asignación?',
      text: "El docente dejará de dictar este curso en la sección.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.academicService.deleteTeacherCourseAssignment(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Removida', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
            this.loadInitialData();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo remover', 'error')
        });
      }
    });
  }
}
