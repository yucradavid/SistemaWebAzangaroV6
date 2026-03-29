//src/app/features/admin/admissions/enrollment-approvals/enrollment-approvals.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { EnrollmentApplication, EnrollmentProvisionCredentials, EnrollmentService } from '@core/services/enrollment.service';
import { AcademicService, GradeLevel, Section } from '@core/services/academic.service';

type AcademicYearOption = {
  id: string;
  year: number;
  is_active?: boolean;
};

@Component({
  selector: 'app-enrollment-approvals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BackButtonComponent],
  templateUrl: './enrollment-approvals.component.html',
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class EnrollmentApprovalsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly academicService = inject(AcademicService);

  applications: EnrollmentApplication[] = [];
  allSections: Section[] = [];
  filteredSections: Section[] = [];
  gradeLevels: GradeLevel[] = [];
  academicYears: AcademicYearOption[] = [];
  selectedStatus = 'pending';
  searchTerm = '';
  errorMessage = '';

  showApproveModal = false;
  selectedApp: EnrollmentApplication | null = null;
  selectedSectionId = '';

  showDetailModal = false;
  detailApplication: EnrollmentApplication | null = null;
  selectedDetailId: string | null = null;
  isLoadingDetail = false;

  processingApplicationId: string | null = null;
  processingAction: 'approve' | 'reject' | 'credentials' | null = null;

  ngOnInit(): void {
    this.loadApplications();
    this.loadSections();
    this.loadGradeLevels();
    this.loadAcademicYears();
  }

  get visibleApplications(): EnrollmentApplication[] {
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      return this.applications;
    }

    return this.applications.filter((app) => {
      const haystack = [
        app.student_first_name,
        app.student_last_name,
        app.student_document_number,
        app.guardian_first_name,
        app.guardian_last_name,
        app.guardian_document_number,
        app.guardian_phone,
        app.guardian_email,
      ]
        .map((value) => this.normalizeText(value))
        .join(' ');

      return haystack.includes(term);
    });
  }

  get pendingCount(): number {
    return this.applications.filter((app) => app.status === 'pending').length;
  }

  get applicationsWithAlerts(): number {
    return this.applications.filter((app) => !!app.has_special_needs || !!app.notes).length;
  }

  get applicationsWithEmergencyContact(): number {
    return this.applications.filter((app) => !!app.emergency_contact_name || !!app.emergency_contact_phone).length;
  }

  loadApplications(): void {
    this.errorMessage = '';

    this.enrollmentService.getApplications({ status: this.selectedStatus, per_page: 100 }).subscribe({
      next: (res) => {
        this.applications = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'No se pudieron cargar las solicitudes de pre matricula.';
      }
    });
  }

  loadSections(): void {
    this.academicService.getSections({ per_page: 500 }).subscribe({
      next: (res) => {
        this.allSections = Array.isArray(res?.data) ? res.data : [];
        this.syncFilteredSections();
      },
      error: (err) => console.error(err)
    });
  }

  loadGradeLevels(): void {
    this.academicService.getGradeLevels({ per_page: 200 }).subscribe({
      next: (res) => {
        this.gradeLevels = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => console.error(err)
    });
  }

  loadAcademicYears(): void {
    this.academicService.getAcademicYears({ per_page: 50 }).subscribe({
      next: (res) => {
        this.academicYears = this.extractCollection<AcademicYearOption>(res);
      },
      error: (err) => console.error(err)
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'rejected':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    }
  }

  getGradeLabel(gradeLevelId: string): string {
    return this.gradeLevels.find((item) => item.id === gradeLevelId)?.name || 'Grado no definido';
  }

  getAcademicYearLabel(academicYearId: string): string {
    const year = this.academicYears.find((item) => item.id === academicYearId)?.year;
    return year ? String(year) : 'Ano no definido';
  }

  formatSectionLabel(section: Section): string {
    const sectionName = section.section_letter || section.name || 'Sin nombre';
    const vacancies = typeof section.vacancies === 'number' ? ` - ${section.vacancies} vacantes` : '';
    return `${sectionName}${vacancies}`;
  }

  formatDocument(type?: string | null, number?: string | null): string {
    const cleanType = String(type || 'DOC').trim().toUpperCase();
    const cleanNumber = String(number || '').trim();

    return cleanNumber ? `${cleanType}: ${cleanNumber}` : 'No registrado';
  }

  formatGender(gender?: string | null): string {
    if (gender === 'M') return 'Masculino';
    if (gender === 'F') return 'Femenino';
    return gender || 'No registrado';
  }

  formatGuardianName(app: EnrollmentApplication): string {
    return `${app.guardian_first_name || 'Sin dato'} ${app.guardian_last_name || ''}`.trim();
  }

  formatEmergencyContact(app: EnrollmentApplication): string {
    const name = String(app.emergency_contact_name || '').trim();
    const phone = String(app.emergency_contact_phone || '').trim();

    if (!name && !phone) return 'No registrado';
    if (name && phone) return `${name} - ${phone}`;
    return name || phone;
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

  openDetailModal(app: EnrollmentApplication): void {
    this.showDetailModal = true;
    this.selectedDetailId = app.id;
    this.detailApplication = null;
    this.isLoadingDetail = true;

    this.enrollmentService.getApplication(app.id).subscribe({
      next: (response) => {
        this.detailApplication = response;
        this.isLoadingDetail = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingDetail = false;
        this.errorMessage = 'No se pudo cargar el detalle completo de la solicitud.';
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.detailApplication = null;
    this.selectedDetailId = null;
    this.isLoadingDetail = false;
  }

  onApproveClick(app: EnrollmentApplication): void {
    this.selectedApp = app;
    this.selectedSectionId = '';
    this.showApproveModal = true;
    this.syncFilteredSections();
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.selectedApp = null;
    this.selectedSectionId = '';
    this.filteredSections = [];
  }

  onRejectClick(app: EnrollmentApplication): void {
    const reason = prompt('Motivo del rechazo:');
    const trimmedReason = String(reason || '').trim();

    if (!trimmedReason) return;

    this.processingApplicationId = app.id;
    this.processingAction = 'reject';

    this.enrollmentService.rejectApplication(app.id, trimmedReason).subscribe({
      next: () => {
        this.processingApplicationId = null;
        this.processingAction = null;
        this.loadApplications();
      },
      error: (err) => {
        console.error(err);
        this.processingApplicationId = null;
        this.processingAction = null;
        alert(err?.error?.message || 'No se pudo rechazar la solicitud.');
      }
    });
  }

  approve(): void {
    if (!this.selectedApp || !this.selectedSectionId) return;

    this.processingApplicationId = this.selectedApp.id;
    this.processingAction = 'approve';

    this.enrollmentService.approveApplication(this.selectedApp.id, this.selectedSectionId).subscribe({
      next: (response) => {
        const message = response?.message || 'Solicitud aprobada.';
        const credentials = response?.data?.credentials as EnrollmentProvisionCredentials | null | undefined;
        const credentialsError = response?.data?.credentials_error as string | null | undefined;

        this.processingApplicationId = null;
        this.processingAction = null;
        this.closeApproveModal();
        this.loadApplications();

        if (credentials) {
          this.showCredentialsModal(credentials, message);
          return;
        }

        if (credentialsError) {
          void Swal.fire({
            icon: 'warning',
            title: 'Matricula aprobada',
            text: `${message} ${credentialsError}`.trim(),
            confirmButtonText: 'Entendido',
          });
          return;
        }

        void Swal.fire({
          icon: 'success',
          title: 'Solicitud aprobada',
          text: message,
          confirmButtonText: 'Aceptar',
        });
      },
      error: (err) => {
        console.error(err);
        this.processingApplicationId = null;
        this.processingAction = null;
        void Swal.fire({
          icon: 'error',
          title: 'No se pudo aprobar',
          text: err?.error?.message || 'Error al aprobar la solicitud.',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  generateCredentials(app: EnrollmentApplication): void {
    this.processingApplicationId = app.id;
    this.processingAction = 'credentials';

    this.enrollmentService.provisionAccounts(app.id).subscribe({
      next: (response) => {
        const credentials = response?.data?.credentials as EnrollmentProvisionCredentials | null | undefined;

        this.processingApplicationId = null;
        this.processingAction = null;
        this.loadApplications();

        if (credentials) {
          this.showCredentialsModal(credentials, response?.message || 'Credenciales generadas.');
          return;
        }

        void Swal.fire({
          icon: 'success',
          title: 'Proceso completado',
          text: response?.message || 'Las credenciales fueron generadas correctamente.',
          confirmButtonText: 'Aceptar',
        });
      },
      error: (err) => {
        console.error(err);
        this.processingApplicationId = null;
        this.processingAction = null;
        void Swal.fire({
          icon: 'error',
          title: 'No se pudieron generar las credenciales',
          text: err?.error?.message || 'Ocurrio un error al generar las credenciales.',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  isBusy(appId?: string | null): boolean {
    return !!appId && this.processingApplicationId === appId;
  }

  private syncFilteredSections(): void {
    if (!this.selectedApp) {
      this.filteredSections = [];
      return;
    }

    this.filteredSections = this.allSections.filter((section) => {
      return section.academic_year_id === this.selectedApp?.academic_year_id
        && section.grade_level_id === this.selectedApp?.grade_level_id;
    });
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private showCredentialsModal(credentials: EnrollmentProvisionCredentials, message: string): void {
    const studentPassword = credentials.student.password || 'Ya existia una cuenta previa';
    const guardianPassword = credentials.guardian.password || 'Ya existia una cuenta previa';

    void Swal.fire({
      icon: 'success',
      title: 'Credenciales generadas',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6">
          <p style="margin:0 0 12px">${this.escapeHtml(message)}</p>
          <div style="margin:0 0 14px;padding:12px;border:1px solid #dbeafe;border-radius:16px;background:#eff6ff">
            <strong style="display:block;margin-bottom:6px">Alumno</strong>
            <div><b>Correo:</b> ${this.escapeHtml(credentials.student.email)}</div>
            <div><b>Clave inicial:</b> ${this.escapeHtml(studentPassword)}</div>
          </div>
          <div style="padding:12px;border:1px solid #dcfce7;border-radius:16px;background:#f0fdf4">
            <strong style="display:block;margin-bottom:6px">Apoderado</strong>
            <div><b>Correo:</b> ${this.escapeHtml(credentials.guardian.email)}</div>
            <div><b>Clave inicial:</b> ${this.escapeHtml(guardianPassword)}</div>
          </div>
        </div>
      `,
      width: 720,
      confirmButtonText: 'Cerrar',
    });
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
