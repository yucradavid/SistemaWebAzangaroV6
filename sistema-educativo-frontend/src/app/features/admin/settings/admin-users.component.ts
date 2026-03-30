//src/app/features/admin/settings/admin-users.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AcademicService, Section, StudentRecordLite } from '@core/services/academic.service';
import { CreateUserPayload, UserProfile, UserService } from '@core/services/user.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';

type RoleOption = {
  value: string;
  label: string;
};

type CreateUserForm = {
  name: string;
  email: string;
  role: string;
  password: string;
  dni: string;
  phone: string;
  address: string;
  specialization: string;
  hire_date: string;
  birth_date: string;
  gender: string;
  section_id: string;
  enrollment_date: string;
  relationship: string;
  is_primary: boolean;
  related_student_id: string;
  relationship_is_primary: boolean;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, SettingMetricCardComponent],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly academicService = inject(AcademicService);
  private studentSearchDebounce?: ReturnType<typeof setTimeout>;

  readonly users = signal<UserProfile[]>([]);
  readonly sections = signal<Section[]>([]);
  readonly students = signal<StudentRecordLite[]>([]);
  readonly loading = signal(false);
  readonly showModal = signal(false);
  readonly submitting = signal(false);
  readonly searchingStudents = signal(false);
  readonly academicRoleValues = ['teacher', 'student', 'guardian'];

  readonly roleOptions: RoleOption[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'director', label: 'Director' },
    { value: 'coordinator', label: 'Coordinador' },
    { value: 'secretary', label: 'Secretaria' },
    { value: 'teacher', label: 'Docente' },
    { value: 'student', label: 'Estudiante' },
    { value: 'guardian', label: 'Apoderado' },
    { value: 'cashier', label: 'Caja' },
    { value: 'administrative', label: 'Encargado de Asistencia' },
    { value: 'finance', label: 'Finanzas' },
    { value: 'web_editor', label: 'Editor Web' }
  ];

  newUser: CreateUserForm = this.getEmptyUserForm();
  studentSearchText = '';

  readonly stats = signal({
    total: 0,
    active: 0,
    inactive: 0,
    teachers: 0
  });

  readonly filters = {
    role: 'Todos',
    isActive: undefined as boolean | undefined,
    q: ''
  };

  get simpleRoleCount(): number {
    return this.roleOptions.length - this.academicRoleValues.length;
  }

  get academicRoleCount(): number {
    return this.academicRoleValues.length;
  }

  get currentViewCount(): number {
    return this.users().length;
  }

  get academicUsersCount(): number {
    return this.users().filter((user) => !this.isSimpleRole(user.role)).length;
  }

  get operationalUsersCount(): number {
    return this.users().filter((user) => this.isSimpleRole(user.role)).length;
  }

  ngOnInit() {
    this.loadUsers();
    this.loadStats();
    this.loadSections();
  }

  loadStats() {
    this.userService.getStats().subscribe({
      next: (response) => {
        const data = response?.data || response;
        this.stats.set({
          total: data?.total || 0,
          active: data?.active || 0,
          inactive: data?.inactive || 0,
          teachers: data?.teachers || 0
        });
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getProfiles({
      role: this.filters.role,
      is_active: this.filters.isActive,
      q: this.filters.q,
      per_page: 50
    }).subscribe({
      next: (response) => {
        this.users.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading.set(false);
      }
    });
  }

  loadSections() {
    this.academicService.getSections({ per_page: 200, simple: true }).subscribe({
      next: (response) => {
        this.sections.set(this.normalizeCollection<Section>(response));
      },
      error: (error) => {
        console.error('Error loading sections:', error);
        this.sections.set([]);
      }
    });
  }

  trackByUser(_: number, user: UserProfile) {
    return user.id;
  }

  getRoleClass(role: string) {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'director':
        return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100';
      case 'coordinator':
        return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'secretary':
        return 'bg-cyan-50 text-cyan-600 border-cyan-100';
      case 'teacher':
      case 'docente':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'student':
      case 'estudiante':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'guardian':
      case 'apoderado':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'cashier':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'finance':
        return 'bg-lime-50 text-lime-700 border-lime-100';
      case 'web_editor':
        return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'administrative':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  getRoleLabel(role: string) {
    const option = this.roleOptions.find((item) => item.value === (role || '').toLowerCase());
    return option?.label || role;
  }

  getRoleHelperText() {
    switch (this.newUser.role) {
      case 'teacher':
        return 'Crea user, profile y teachers en una sola operacion';
      case 'student':
        return 'Crea user, profile y students con codigo academico automatico';
      case 'guardian':
        return 'Crea user, profile y guardians para el apoderado y opcion de vincular estudiante';
      case 'finance':
        return 'Crea user y profile para finanzas sin tabla academica adicional';
      case 'web_editor':
        return 'Crea user y profile para la gestion del sitio web institucional';
      case 'administrative':
        return 'Crea user y profile para operar unicamente el modulo de asistencia';
      default:
        return 'Crea user y profile para roles administrativos';
    }
  }

  getRoleScopeLabel(role: string) {
    return this.isSimpleRole(role) ? 'Perfil simple' : 'Perfil academico';
  }

  getRoleRecordTargets(role: string) {
    switch ((role || '').toLowerCase()) {
      case 'teacher':
        return ['users', 'profiles', 'teachers'];
      case 'student':
        return ['users', 'profiles', 'students'];
      case 'guardian':
        return ['users', 'profiles', 'guardians'];
      default:
        return ['users', 'profiles'];
    }
  }

  getSectionLabel(section: Section) {
    const grade = (section as any).gradeLevel?.name || (section as any).grade_level?.name || 'Grado';
    const letter = section.section_letter || section.name || '';
    return `${grade} - Seccion ${letter}`.trim();
  }

  getStudentLabel(student: StudentRecordLite) {
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Estudiante';
    const code = student.student_code ? ` - ${student.student_code}` : '';
    return `${fullName}${code}`;
  }

  isSimpleRole(role: string) {
    return !this.academicRoleValues.includes((role || '').toLowerCase());
  }

  openCreateModal() {
    this.newUser = this.getEmptyUserForm();
    this.studentSearchText = '';
    this.students.set([]);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.newUser = this.getEmptyUserForm();
    this.studentSearchText = '';
    this.students.set([]);
  }

  createUser(event: Event) {
    event.preventDefault();

    if (this.submitting()) {
      return;
    }

    const payload = this.buildPayload();

    this.submitting.set(true);
    this.userService.createUser(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.loadUsers();
        this.loadStats();
        Swal.fire({
          icon: 'success',
          title: `${this.getRoleLabel(payload.role)} creado`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.submitting.set(false);
        Swal.fire('Error', this.getErrorMessage(error), 'error');
      }
    });
  }

  deleteUser(user: UserProfile) {
    Swal.fire({
      title: `Eliminar a ${user.full_name}?`,
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (!result.isConfirmed) {
        return;
      }

      const deleteRequest = user.user_id
        ? this.userService.deleteUser(user.user_id)
        : this.userService.deleteProfile(user.id);

      deleteRequest.subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
          });
          this.loadUsers();
          this.loadStats();
        },
        error: (error) => Swal.fire('Error', error.error?.message || 'No se pudo eliminar el usuario', 'error')
      });
    });
  }

  onStudentSearchChange(query: string) {
    this.studentSearchText = query;

    if (!query.trim()) {
      this.newUser.related_student_id = '';
      this.newUser.relationship_is_primary = false;
      this.students.set([]);
      return;
    }

    if (query.trim().length < 2) {
      this.students.set([]);
      return;
    }

    if (this.studentSearchDebounce) {
      clearTimeout(this.studentSearchDebounce);
    }

    this.studentSearchDebounce = setTimeout(() => {
      this.searchingStudents.set(true);
      this.academicService.getStudents({ q: query.trim(), per_page: 15 }).subscribe({
        next: (response) => {
          this.students.set(this.normalizeCollection<StudentRecordLite>(response));
          this.searchingStudents.set(false);
        },
        error: (error) => {
          console.error('Error searching students:', error);
          this.students.set([]);
          this.searchingStudents.set(false);
        }
      });
    }, 250);
  }

  selectStudent(student: StudentRecordLite) {
    this.newUser.related_student_id = student.id;
    this.studentSearchText = this.getStudentLabel(student);
    this.students.set([]);
  }

  clearStudentSelection() {
    this.newUser.related_student_id = '';
    this.newUser.relationship_is_primary = false;
    this.studentSearchText = '';
    this.students.set([]);
  }

  private getEmptyUserForm(): CreateUserForm {
    return {
      name: '',
      email: '',
      role: 'teacher',
      password: '',
      dni: '',
      phone: '',
      address: '',
      specialization: '',
      hire_date: '',
      birth_date: '',
      gender: '',
      section_id: '',
      enrollment_date: '',
      relationship: '',
      is_primary: false,
      related_student_id: '',
      relationship_is_primary: false
    };
  }

  private buildPayload(): CreateUserPayload {
    const payload: CreateUserPayload = {
      name: this.newUser.name.trim(),
      email: this.newUser.email.trim(),
      role: this.newUser.role,
      password: this.newUser.password
    };

    if (this.newUser.dni.trim()) {
      payload.dni = this.newUser.dni.trim();
    }

    switch (this.newUser.role) {
      case 'teacher':
        if (this.newUser.phone.trim()) payload.phone = this.newUser.phone.trim();
        if (this.newUser.specialization.trim()) payload.specialization = this.newUser.specialization.trim();
        if (this.newUser.hire_date) payload.hire_date = this.newUser.hire_date;
        break;
      case 'student':
        if (this.newUser.birth_date) payload.birth_date = this.newUser.birth_date;
        if (this.newUser.gender) payload.gender = this.newUser.gender;
        if (this.newUser.address.trim()) payload.address = this.newUser.address.trim();
        if (this.newUser.section_id) payload.section_id = this.newUser.section_id;
        if (this.newUser.enrollment_date) payload.enrollment_date = this.newUser.enrollment_date;
        break;
      case 'guardian':
        if (this.newUser.phone.trim()) payload.phone = this.newUser.phone.trim();
        if (this.newUser.address.trim()) payload.address = this.newUser.address.trim();
        if (this.newUser.relationship.trim()) payload.relationship = this.newUser.relationship.trim();
        payload.is_primary = this.newUser.is_primary;
        if (this.newUser.related_student_id) payload.related_student_id = this.newUser.related_student_id;
        if (this.newUser.related_student_id) payload.relationship_is_primary = this.newUser.relationship_is_primary;
        break;
    }

    return payload;
  }

  private getErrorMessage(error: any) {
    const validationErrors = error?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      const firstMessage = validationErrors[firstKey]?.[0];
      if (firstMessage) {
        return firstMessage;
      }
    }

    return error?.error?.message || 'Error al crear usuario';
  }

  private normalizeCollection<T>(response: any): T[] {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }
}
