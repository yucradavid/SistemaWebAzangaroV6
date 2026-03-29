//src/app/features/admin/settings/students.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { SettingFilterDropdownComponent } from '@shared/components/setting-filter-dropdown/setting-filter-dropdown.component';
import { AcademicService, Course, Section, StudentCourseEnrollment } from '@core/services/academic.service';
import { UserService, UserProfile } from '@core/services/user.service';

interface StudentRecord {
  id: string;
  user_id?: string | null;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  status?: string;
  section_id?: string | null;
  section?: any;
  enrollment_date?: string;
}

interface StudentViewModel {
  profile: UserProfile;
  student: StudentRecord | null;
  enrollments: StudentCourseEnrollment[];
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, SettingMetricCardComponent, SettingFilterDropdownComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-[#0F172A] tracking-tight">Gestion de estudiantes</h1>
          <p class="text-slate-500 text-sm font-medium">Visualiza alumnos, sus cursos y asigna nuevas inscripciones desde detalle.</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mt-2 mb-6">
        <app-setting-metric-card label="Total Estudiantes" [value]="totalStudents"></app-setting-metric-card>
        <app-setting-metric-card label="Activos" [value]="activeStudents"></app-setting-metric-card>
        <app-setting-metric-card label="Inactivos" [value]="inactiveStudents"></app-setting-metric-card>
        <app-setting-metric-card label="Prom. Cursos" [value]="avgCourses | number:'1.0-1'"></app-setting-metric-card>
      </div>

      <div class="bg-white border border-slate-100/50 rounded-[2rem] p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4 px-6">
        <div class="flex items-center gap-4 flex-1 w-full">
          <div class="text-slate-400">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Buscar por nombre, email, codigo o DNI..." class="flex-1 bg-transparent border-none text-sm font-bold text-[#0F172A] focus:ring-0 placeholder-slate-300">
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div class="w-full sm:w-52">
            <app-setting-filter-dropdown
              [options]="academicYearFilterOptions"
              [selectedId]="academicYearFilter"
              placeholder="Todos los anios"
              (selectionChange)="updateAcademicYearFilter($event)">
            </app-setting-filter-dropdown>
          </div>
          <div class="w-full sm:w-56">
            <app-setting-filter-dropdown
              [options]="sectionFilterOptions"
              [selectedId]="sectionFilter"
              placeholder="Todas las secciones"
              (selectionChange)="updateSectionFilter($event)">
            </app-setting-filter-dropdown>
          </div>
          <div class="w-full lg:w-48">
            <app-setting-filter-dropdown
              [options]="[{id: 'true', name: 'Activos'}, {id: 'false', name: 'Inactivos'}]"
              [selectedId]="statusFilter"
              placeholder="Todos los estados"
              (selectionChange)="updateStatusFilter($event)">
            </app-setting-filter-dropdown>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>

      <div *ngIf="!loading" class="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estudiante</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Cursos inscritos</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seccion actual</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha registro</th>
                <th class="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let student of filteredStudents" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-white shadow-sm flex items-center justify-center text-[#0E3A8A] font-bold text-xs uppercase">
                      {{ student.profile.full_name.charAt(0) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-[#0F172A] leading-tight tracking-tight uppercase">{{ student.profile.full_name }}</span>
                      <span class="text-[10px] font-semibold text-slate-400 lowercase">{{ student.profile.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <button
                      (click)="openStudentDetail(student)"
                      class="px-4 py-2 bg-white text-[#0E3A8A] border-2 border-slate-50 hover:border-[#0E3A8A] rounded-2xl text-[10px] font-bold uppercase tracking-tighter transition-all shadow-sm">
                      {{ student.enrollments.length }} cursos
                    </button>
                    <div *ngIf="student.enrollments.length > 0" class="flex flex-wrap justify-center gap-1.5 max-w-[260px]">
                      <span
                        *ngFor="let courseName of getEnrollmentPreview(student.enrollments)"
                        class="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-[10px] font-bold tracking-tight">
                        {{ courseName }}
                      </span>
                      <span
                        *ngIf="student.enrollments.length > 3"
                        class="px-2.5 py-1 bg-blue-50 text-[#0E3A8A] border border-blue-100 rounded-full text-[10px] font-bold tracking-tight">
                        +{{ student.enrollments.length - 3 }} mas
                      </span>
                    </div>
                    <span *ngIf="student.enrollments.length === 0" class="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
                      Sin cursos
                    </span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-bold text-slate-700">{{ getStudentSectionLabel(student.student) }}</span>
                    <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      {{ getStudentAcademicYearLabel(student) }}
                    </span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <span [class]="'px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ' + (student.profile.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100')">
                    {{ student.profile.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-8 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                  {{ student.profile.created_at | date:'dd MMM yyyy' }}
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-2">
                    <button (click)="openStudentDetail(student)" class="p-2.5 bg-white text-[#0E3A8A] border-2 border-slate-50 hover:border-[#0E3A8A] rounded-xl transition-all shadow-sm active:scale-95" title="Ver detalle">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredStudents.length === 0" class="p-12 text-center">
            <p class="text-slate-400 font-bold uppercase tracking-widest text-center">No se encontraron estudiantes correspondientes</p>
          </div>
        </div>
      </div>

      <div *ngIf="showDetailModal && detailStudent" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 class="text-xl font-bold text-[#0F172A]">Detalle del estudiante</h3>
              <p class="text-sm text-slate-500 mt-1">Recuperado el flujo para ver e inscribir cursos al alumno.</p>
            </div>
            <button (click)="closeStudentDetail()" class="p-2 rounded-xl hover:bg-white/80 text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="p-6 sm:p-8 grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-8 max-h-[85vh] overflow-y-auto">
            <div class="space-y-6">
              <div class="rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-6">
                <div class="flex items-start gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-white shadow-sm flex items-center justify-center text-[#0E3A8A] font-bold text-lg uppercase">
                    {{ detailStudent.profile.full_name.charAt(0) }}
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-xl font-bold text-[#0F172A] uppercase tracking-tight">{{ detailStudent.profile.full_name }}</h4>
                    <p class="text-sm text-slate-500">{{ detailStudent.profile.email }}</p>
                    <p class="text-xs text-slate-400 uppercase tracking-widest">Codigo: {{ detailStudent.student?.student_code || 'Sin codigo' }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div class="rounded-2xl bg-white border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DNI</p>
                    <p class="text-sm font-semibold text-slate-800">{{ detailStudent.student?.dni || '-' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                    <p class="text-sm font-semibold text-slate-800">{{ detailStudent.profile.is_active ? 'Activo' : 'Inactivo' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Seccion actual</p>
                    <p class="text-sm font-semibold text-slate-800">{{ getStudentSectionLabel(detailStudent.student) }}</p>
                  </div>
                  <div class="rounded-2xl bg-white border border-slate-100 p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha matricula</p>
                    <p class="text-sm font-semibold text-slate-800">{{ getDetailEnrollmentDate() }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-[1.5rem] border border-slate-100 overflow-hidden">
                <div class="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                  <h4 class="text-sm font-bold uppercase tracking-widest text-slate-500">Cursos inscritos</h4>
                  <span class="text-xs font-bold text-[#0E3A8A]">{{ detailStudent.enrollments.length }} registros</span>
                </div>
                <div *ngIf="detailStudent.enrollments.length === 0" class="p-8 text-center text-slate-400 text-sm font-medium">
                  El estudiante aun no tiene cursos asignados.
                </div>
                <div *ngIf="detailStudent.enrollments.length > 0" class="divide-y divide-slate-50">
                  <div *ngFor="let enrollment of detailStudent.enrollments" class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-bold text-slate-900">{{ enrollment.course?.name || 'Curso' }}</p>
                      <p class="text-[11px] text-slate-400">
                        {{ enrollment.section?.gradeLevel?.name || 'Sin grado' }} {{ enrollment.section?.section_letter || enrollment.section?.name || '' }}
                        | {{ enrollment.academic_year?.year || enrollment.academicYear?.year || 'Sin anio' }}
                      </p>
                    </div>
                    <div class="flex flex-col sm:items-end gap-2">
                      <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                        [class.bg-green-50]="enrollment.status === 'active'"
                        [class.text-green-600]="enrollment.status === 'active'"
                        [class.border-green-100]="enrollment.status === 'active'"
                        [class.bg-blue-50]="enrollment.status === 'completed'"
                        [class.text-blue-600]="enrollment.status === 'completed'"
                        [class.border-blue-100]="enrollment.status === 'completed'"
                        [class.bg-yellow-50]="enrollment.status === 'dropped'"
                        [class.text-yellow-600]="enrollment.status === 'dropped'"
                        [class.border-yellow-100]="enrollment.status === 'dropped'">
                        {{ getStatusLabel(enrollment.status) }}
                      </span>
                      <div class="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          (click)="updateEnrollmentStatus(enrollment, 'active')"
                          [disabled]="updatingEnrollmentId === enrollment.id || enrollment.status === 'active'"
                          class="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-green-100 bg-green-50 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Activar
                        </button>
                        <button
                          (click)="updateEnrollmentStatus(enrollment, 'completed')"
                          [disabled]="updatingEnrollmentId === enrollment.id || enrollment.status === 'completed'"
                          class="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-100 bg-blue-50 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Completar
                        </button>
                        <button
                          (click)="updateEnrollmentStatus(enrollment, 'dropped')"
                          [disabled]="updatingEnrollmentId === enrollment.id || enrollment.status === 'dropped'"
                          class="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-yellow-100 bg-yellow-50 text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          Retirar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="rounded-[1.5rem] border border-slate-100 bg-white overflow-hidden">
                <div class="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
                  <h4 class="text-sm font-bold uppercase tracking-widest text-slate-500">Asignar curso</h4>
                </div>

                <div class="p-6 space-y-5">
                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anio academico</label>
                    <app-setting-filter-dropdown
                      [options]="academicYearOptions"
                      [selectedId]="assignForm.academic_year_id"
                      placeholder="Selecciona un anio"
                      (selectionChange)="onAssignAcademicYearChange($event)">
                    </app-setting-filter-dropdown>
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seccion</label>
                    <app-setting-filter-dropdown
                      [options]="sectionOptionsForAssign"
                      [selectedId]="assignForm.section_id"
                      placeholder="Selecciona una seccion"
                      (selectionChange)="onAssignSectionChange($event)">
                    </app-setting-filter-dropdown>
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso</label>
                    <app-setting-filter-dropdown
                      [options]="courseOptionsForAssign"
                      [selectedId]="assignForm.course_id"
                      placeholder="Selecciona un curso"
                      (selectionChange)="assignForm.course_id = $event">
                    </app-setting-filter-dropdown>
                    <p class="text-xs text-slate-400">Se filtran cursos compatibles con el grado de la seccion.</p>
                    <p *ngIf="assignForm.course_id && isCourseAlreadyAssigned(assignForm.course_id, assignForm.academic_year_id)" class="text-xs font-semibold text-yellow-600">
                      El estudiante ya tiene ese curso asignado en el anio seleccionado.
                    </p>
                  </div>

                  <button
                    (click)="assignCourseToDetailStudent()"
                    [disabled]="assigningCourse || !detailStudent.student || !assignForm.academic_year_id || !assignForm.section_id || !assignForm.course_id || isCourseAlreadyAssigned(assignForm.course_id, assignForm.academic_year_id)"
                    class="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-red-600 text-white text-sm font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ assigningCourse ? 'Asignando...' : 'Asignar curso al estudiante' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentsComponent implements OnInit {
  studentsData: StudentViewModel[] = [];
  filteredStudents: StudentViewModel[] = [];
  enrollmentsList: StudentCourseEnrollment[] = [];
  studentRecords: StudentRecord[] = [];
  academicYears: any[] = [];
  sections: Section[] = [];
  courses: Course[] = [];

  loading = false;
  searchTerm = '';
  statusFilter = '';
  academicYearFilter = '';
  sectionFilter = '';

  showDetailModal = false;
  detailStudent: StudentViewModel | null = null;
  assigningCourse = false;
  updatingEnrollmentId = '';
  assignForm = {
    academic_year_id: '',
    section_id: '',
    course_id: ''
  };

  constructor(
    private userService: UserService,
    private academicService: AcademicService
  ) {}

  get totalStudents() { return this.studentsData.length; }
  get activeStudents() { return this.studentsData.filter((student) => student.profile.is_active).length; }
  get inactiveStudents() { return this.studentsData.filter((student) => !student.profile.is_active).length; }
  get avgCourses() {
    const totalEnrollments = this.studentsData.reduce((acc, curr) => acc + curr.enrollments.length, 0);
    return this.totalStudents === 0 ? 0 : totalEnrollments / this.totalStudents;
  }
  get academicYearOptions() {
    return this.academicYears.map((year: any) => ({ id: year.id, name: String(year.year) }));
  }
  get academicYearFilterOptions() {
    return this.academicYearOptions;
  }
  get sectionFilterOptions() {
    return this.sections
      .filter((section: any) => {
        if (!this.academicYearFilter) {
          return true;
        }

        return String(section.academic_year_id || '') === this.academicYearFilter;
      })
      .map((section: any) => ({
        id: section.id,
        name: this.buildSectionLabel(section)
      }));
  }
  get sectionOptionsForAssign() {
    return this.sections
      .filter((section: any) => {
        if (!this.assignForm.academic_year_id) {
          return true;
        }
        return String(section.academic_year_id || '') === this.assignForm.academic_year_id;
      })
      .map((section: any) => ({
        id: section.id,
        name: this.buildSectionLabel(section)
      }));
  }
  get courseOptionsForAssign() {
    const selectedSection = this.sections.find((section: any) => section.id === this.assignForm.section_id) as any;
    const gradeLevelId = selectedSection?.grade_level_id || selectedSection?.gradeLevel?.id || null;

    return this.courses
      .filter((course) => !gradeLevelId || course.grade_level_id === gradeLevelId)
      .map((course) => ({ id: course.id, name: course.name }));
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    forkJoin({
      students: this.userService.getProfiles({ role: 'student', per_page: 100 } as any),
      studentRows: this.academicService.getStudents({ per_page: 100 }),
      enrollments: this.academicService.getEnrolledStudents({ per_page: 300 }),
      academicYears: this.academicService.getAcademicYears({ per_page: 100 }),
      sections: this.academicService.getSections({ per_page: 300 }),
      courses: this.academicService.getCourses({ per_page: 300 })
    }).subscribe({
      next: (res: any) => {
        const studentProfiles = this.extractCollection<UserProfile>(res.students);
        this.studentRecords = this.extractCollection<StudentRecord>(res.studentRows);
        this.enrollmentsList = this.extractCollection<StudentCourseEnrollment>(res.enrollments);
        this.academicYears = this.extractCollection<any>(res.academicYears);
        this.sections = this.extractCollection<Section>(res.sections);
        this.courses = this.extractCollection<Course>(res.courses);

        const studentByUserId = new Map<string, StudentRecord>();
        const studentById = new Map<string, StudentRecord>();

        this.studentRecords.forEach((student) => {
          if (student.user_id) {
            studentByUserId.set(student.user_id, student);
          }
          if (student.id) {
            studentById.set(student.id, student);
          }
        });

        this.studentsData = studentProfiles.map((profile) => ({
          profile,
          student: studentByUserId.get(profile.user_id) || studentById.get(profile.id) || null,
          enrollments: this.resolveStudentEnrollments(profile, studentByUserId, studentById)
        }));

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los estudiantes', 'error');
      }
    });
  }

  applyFilters() {
    this.filteredStudents = this.studentsData.filter((student) => {
      const searchValue = this.searchTerm.toLowerCase();
      const matchSearch = this.searchTerm === ''
        || student.profile.full_name.toLowerCase().includes(searchValue)
        || student.profile.email.toLowerCase().includes(searchValue)
        || (student.student?.student_code || '').toLowerCase().includes(searchValue)
        || (student.student?.dni || '').toLowerCase().includes(searchValue);

      const matchStatus = this.statusFilter === ''
        || student.profile.is_active.toString() === this.statusFilter;

      const matchAcademicYear = this.academicYearFilter === ''
        || student.enrollments.some((enrollment) => enrollment.academic_year_id === this.academicYearFilter)
        || this.getStudentAcademicYearId(student) === this.academicYearFilter;

      const matchSection = this.sectionFilter === ''
        || student.student?.section_id === this.sectionFilter
        || student.enrollments.some((enrollment) => enrollment.section_id === this.sectionFilter);

      return matchSearch && matchStatus && matchAcademicYear && matchSection;
    });
  }

  updateStatusFilter(val: string) {
    this.statusFilter = val;
    this.applyFilters();
  }

  updateAcademicYearFilter(val: string) {
    this.academicYearFilter = val;

    if (this.sectionFilter) {
      const sectionStillVisible = this.sections.some((section: any) => {
        return section.id === this.sectionFilter
          && (!this.academicYearFilter || String(section.academic_year_id || '') === this.academicYearFilter);
      });

      if (!sectionStillVisible) {
        this.sectionFilter = '';
      }
    }

    this.applyFilters();
  }

  updateSectionFilter(val: string) {
    this.sectionFilter = val;
    this.applyFilters();
  }

  openStudentDetail(student: StudentViewModel) {
    const orderedEnrollments = [...student.enrollments].sort((left, right) => {
      const leftDate = new Date(left.enrollment_date || 0).getTime();
      const rightDate = new Date(right.enrollment_date || 0).getTime();
      return rightDate - leftDate;
    });

    this.detailStudent = {
      profile: student.profile,
      student: student.student,
      enrollments: orderedEnrollments
    };

    const sectionId = student.student?.section_id || '';
    const currentSection = this.sections.find((section: any) => section.id === sectionId) as any;
    const activeAcademicYearId = currentSection?.academic_year_id
      || orderedEnrollments[0]?.academic_year_id
      || this.academicYears.find((year: any) => year.is_active)?.id
      || '';

    this.assignForm = {
      academic_year_id: activeAcademicYearId,
      section_id: sectionId,
      course_id: ''
    };

    this.showDetailModal = true;
  }

  closeStudentDetail() {
    this.showDetailModal = false;
    this.detailStudent = null;
    this.assigningCourse = false;
    this.assignForm = {
      academic_year_id: '',
      section_id: '',
      course_id: ''
    };
  }

  onAssignAcademicYearChange(academicYearId: string) {
    this.assignForm.academic_year_id = academicYearId;
    const selectedSection = this.sections.find((section: any) => section.id === this.assignForm.section_id) as any;

    if (selectedSection && String(selectedSection.academic_year_id || '') !== academicYearId) {
      this.assignForm.section_id = '';
      this.assignForm.course_id = '';
    }
  }

  onAssignSectionChange(sectionId: string) {
    this.assignForm.section_id = sectionId;
    this.assignForm.course_id = '';
  }

  assignCourseToDetailStudent() {
    if (!this.detailStudent?.student?.id) {
      Swal.fire('Error', 'No se encontro el registro del estudiante.', 'error');
      return;
    }

    if (this.isCourseAlreadyAssigned(this.assignForm.course_id, this.assignForm.academic_year_id)) {
      Swal.fire('Duplicado', 'El estudiante ya tiene ese curso asignado en el anio seleccionado.', 'warning');
      return;
    }

    this.assigningCourse = true;

    this.academicService.createStudentCourseEnrollment({
      student_id: this.detailStudent.student.id,
      course_id: this.assignForm.course_id,
      section_id: this.assignForm.section_id,
      academic_year_id: this.assignForm.academic_year_id,
      status: 'active'
    }).subscribe({
      next: (response) => {
        const enrollment = response?.data || response;
        const createdEnrollment = enrollment?.data || enrollment;
        const selectedSection = this.sections.find((section: any) => section.id === this.assignForm.section_id) as any;

        if (createdEnrollment?.id) {
          this.enrollmentsList = [createdEnrollment, ...this.enrollmentsList];

          const target = this.studentsData.find((item) => item.profile.id === this.detailStudent?.profile.id);
          if (target) {
            target.enrollments = [createdEnrollment, ...target.enrollments];
            if (target.student) {
              target.student.section_id = this.assignForm.section_id;
              target.student.section = selectedSection || target.student.section;
            }
          }

          if (this.detailStudent) {
            this.detailStudent.enrollments = [createdEnrollment, ...this.detailStudent.enrollments];
            if (this.detailStudent.student) {
              this.detailStudent.student.section_id = this.assignForm.section_id;
              this.detailStudent.student.section = selectedSection || this.detailStudent.student.section;
            }
          }

          this.applyFilters();
        }

        this.assignForm.course_id = '';
        this.assigningCourse = false;
        Swal.fire('Curso asignado', response?.message || 'El curso fue asignado correctamente.', 'success');
      },
      error: (err) => {
        this.assigningCourse = false;
        Swal.fire('Error', err?.error?.message || 'No se pudo asignar el curso al estudiante.', 'error');
      }
    });
  }

  updateEnrollmentStatus(enrollment: StudentCourseEnrollment, status: 'active' | 'completed' | 'dropped') {
    if (!enrollment.id || enrollment.status === status) {
      return;
    }

    this.updatingEnrollmentId = enrollment.id;

    this.academicService.updateStudentCourseEnrollment(enrollment.id, { status }).subscribe({
      next: (response) => {
        const updatedEnrollment = response?.data || response;
        this.syncEnrollmentStatus(updatedEnrollment?.id || enrollment.id, updatedEnrollment?.status || status);
        this.updatingEnrollmentId = '';
        Swal.fire('Inscripcion actualizada', response?.message || 'Se actualizo el estado del curso.', 'success');
      },
      error: (err) => {
        this.updatingEnrollmentId = '';
        Swal.fire('Error', err?.error?.message || 'No se pudo actualizar la inscripcion.', 'error');
      }
    });
  }

  getStudentSectionLabel(student: StudentRecord | null): string {
    if (!student) {
      return 'Sin seccion';
    }

    const section = (student.section as any) || this.sections.find((item: any) => item.id === student.section_id);
    return section ? this.buildSectionLabel(section) : 'Sin seccion';
  }

  getEnrollmentPreview(enrollments: StudentCourseEnrollment[]): string[] {
    return enrollments
      .slice(0, 3)
      .map((enrollment) => enrollment.course?.name || 'Curso');
  }

  getStudentAcademicYearLabel(student: StudentViewModel): string {
    const academicYearId = this.getStudentAcademicYearId(student);
    if (!academicYearId) {
      return 'Sin anio';
    }

    const academicYear = this.academicYears.find((year: any) => year.id === academicYearId);
    return academicYear ? String(academicYear.year) : 'Sin anio';
  }

  getStatusLabel(status?: string): string {
    if (status === 'completed') {
      return 'Completado';
    }

    if (status === 'dropped') {
      return 'Retirado';
    }

    return 'Activo';
  }

  isCourseAlreadyAssigned(courseId: string, academicYearId: string): boolean {
    if (!courseId || !academicYearId || !this.detailStudent) {
      return false;
    }

    return this.detailStudent.enrollments.some((enrollment) => {
      return enrollment.course_id === courseId && enrollment.academic_year_id === academicYearId;
    });
  }

  getDetailEnrollmentDate(): string {
    if (!this.detailStudent?.student?.enrollment_date) {
      return '-';
    }

    return new Date(this.detailStudent.student.enrollment_date).toLocaleDateString('es-PE');
  }

  private resolveStudentEnrollments(
    profile: UserProfile,
    studentByUserId: Map<string, StudentRecord>,
    studentById: Map<string, StudentRecord>
  ): StudentCourseEnrollment[] {
    const student = studentByUserId.get(profile.user_id) || studentById.get(profile.id);

    if (!student?.id) {
      return [];
    }

    return this.enrollmentsList.filter((enrollment) => enrollment.student_id === student.id);
  }

  private getStudentAcademicYearId(student: StudentViewModel): string {
    const currentSection = this.sections.find((section: any) => section.id === student.student?.section_id) as any;
    return currentSection?.academic_year_id || student.enrollments[0]?.academic_year_id || '';
  }

  private syncEnrollmentStatus(enrollmentId: string, status: string) {
    this.enrollmentsList = this.enrollmentsList.map((enrollment) => {
      if (enrollment.id !== enrollmentId) {
        return enrollment;
      }

      return {
        ...enrollment,
        status
      };
    });

    this.studentsData = this.studentsData.map((student) => ({
      ...student,
      enrollments: student.enrollments.map((enrollment) => {
        if (enrollment.id !== enrollmentId) {
          return enrollment;
        }

        return {
          ...enrollment,
          status
        };
      })
    }));

    if (this.detailStudent) {
      this.detailStudent = {
        ...this.detailStudent,
        enrollments: this.detailStudent.enrollments.map((enrollment) => {
          if (enrollment.id !== enrollmentId) {
            return enrollment;
          }

          return {
            ...enrollment,
            status
          };
        })
      };
    }

    this.applyFilters();
  }

  private buildSectionLabel(section: any): string {
    const gradeName = section.grade_level?.name || section.gradeLevel?.name || 'Seccion';
    return `${gradeName} ${section.section_letter || section.name || ''}`.trim();
  }

  private extractCollection<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    return [];
  }
}
