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
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
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
