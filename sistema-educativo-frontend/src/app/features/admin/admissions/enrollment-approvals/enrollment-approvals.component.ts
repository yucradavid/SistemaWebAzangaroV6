//src/app/features/admin/admissions/enrollment-approvals/enrollment-approvals.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { forkJoin, Observable } from 'rxjs';
import {
  EnrollmentApplication,
  EnrollmentBillingPreview,
  EnrollmentBillingPreviewOption,
  EnrollmentPaymentMode,
  EnrollmentProvisionCredentials,
  EnrollmentService,
} from '@core/services/enrollment.service';
import { AcademicService, GradeLevel, Section } from '@core/services/academic.service';
import { ApplicationDocumentChecklistItem, ApplicationDocumentsStatus, DocumentService } from '@core/services/document.service';
import { PendingCashCollectionComponent } from '../pending-cash-collection/pending-cash-collection.component';

type AdmissionsView = 'solicitudes' | 'contado';

type AcademicYearOption = {
  id: string;
  year: number;
  is_active?: boolean;
};

@Component({
  selector: 'app-enrollment-approvals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BackButtonComponent, PendingCashCollectionComponent],
  templateUrl: './enrollment-approvals.component.html',
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class EnrollmentApprovalsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly academicService = inject(AcademicService);
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);

  // Pestañas del módulo. La de contado se instancia recién al abrirla, para no
  // pegarle al endpoint de seguimiento en cada entrada a Matrículas.
  activeView: AdmissionsView = 'solicitudes';
  openedCashView = false;
  pendingCashCount = 0;

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

  // Modalidad de pago elegida en el modal de aprobacion. Arranca en contado,
  // que es el caso mas comun en secretaria y el unico siempre disponible.
  selectedPaymentMode: EnrollmentPaymentMode = 'contado';
  selectedInstallments: number | null = null;
  billingPreview: EnrollmentBillingPreview | null = null;
  loadingBillingPreview = false;
  billingPreviewError = '';

  showDetailModal = false;
  detailApplication: EnrollmentApplication | null = null;
  selectedDetailId: string | null = null;
  isLoadingDetail = false;

  processingApplicationId: string | null = null;
  processingAction: 'approve' | 'reject' | 'credentials' | null = null;

  documentsStatusByAppId: Record<string, ApplicationDocumentsStatus> = {};

  showDocumentsChecklist = false;
  documents: ApplicationDocumentChecklistItem[] = [];
  loadingDocuments = false;
  savingDocumentId: string | null = null;
  observation = '';
  savingObservation = false;

  ngOnInit(): void {
    this.loadApplications();
    this.loadSections();
    this.loadGradeLevels();
    this.loadAcademicYears();
  }

  setView(view: AdmissionsView): void {
    this.activeView = view;

    if (view === 'contado') {
      this.openedCashView = true;
    }
  }

  viewTabClass(view: AdmissionsView): string {
    const base = 'px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center border active:scale-95';

    return this.activeView === view
      ? base + ' bg-blue-600 text-white border-blue-600 shadow-md'
      : base + ' bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700';
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
        this.applications = this.extractCollection<EnrollmentApplication>(res);
        this.loadDocumentsStatusForApplications();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'No se pudieron cargar las solicitudes de pre matricula.';
      }
    });
  }

  // Trae el resumen de completitud de documentos de cada solicitud visible,
  // para pintar el punto rojo/verde y habilitar/bloquear el boton Aprobar.
  loadDocumentsStatusForApplications(): void {
    if (this.applications.length === 0) {
      this.documentsStatusByAppId = {};
      return;
    }

    const requests: Record<string, Observable<ApplicationDocumentsStatus>> = {};
    this.applications.forEach((app) => {
      requests[app.id] = this.documentService.getApplicationDocumentsStatus(app.id);
    });

    forkJoin(requests).subscribe({
      next: (statusById) => {
        this.documentsStatusByAppId = statusById;
      },
      error: (err) => console.error(err)
    });
  }

  documentsComplete(app: EnrollmentApplication): boolean {
    return this.documentsStatusByAppId[app.id]?.is_complete === true;
  }

  missingDocsCount(app: EnrollmentApplication): number {
    const status = this.documentsStatusByAppId[app.id];
    return status ? Math.max(status.total_required - status.delivered_required, 0) : 0;
  }

  documentsDeliveredRequired(app: EnrollmentApplication): number {
    return this.documentsStatusByAppId[app.id]?.delivered_required ?? 0;
  }

  documentsTotalRequired(app: EnrollmentApplication): number {
    return this.documentsStatusByAppId[app.id]?.total_required ?? 0;
  }

  loadSections(): void {
    this.academicService.getSections({ per_page: 500 }).subscribe({
      next: (res) => {
        this.allSections = this.extractCollection<Section>(res);
        this.syncFilteredSections();
      },
      error: (err) => console.error(err)
    });
  }

  loadGradeLevels(): void {
    this.academicService.getGradeLevels({ per_page: 200 }).subscribe({
      next: (res) => {
        this.gradeLevels = this.extractCollection<GradeLevel>(res);
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
    this.showDocumentsChecklist = false;
    this.documents = [];
    this.observation = '';
  }

  onApproveClick(app: EnrollmentApplication): void {
    this.selectedApp = app;
    this.selectedSectionId = '';
    this.selectedPaymentMode = 'contado';
    this.selectedInstallments = null;
    this.billingPreview = null;
    this.billingPreviewError = '';
    this.showApproveModal = true;
    this.syncFilteredSections();
    this.loadBillingPreview(app.id);
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.selectedApp = null;
    this.selectedSectionId = '';
    this.filteredSections = [];
    this.billingPreview = null;
    this.billingPreviewError = '';
    this.loadingBillingPreview = false;
  }

  // Los montos, fechas y descuentos los calcula el backend con los mismos
  // servicios que despues generan los cargos: aca no se replica ninguna
  // formula, solo se muestra lo que llega.
  private loadBillingPreview(applicationId: string): void {
    this.loadingBillingPreview = true;

    this.enrollmentService.getBillingPreview(applicationId).subscribe({
      next: (preview) => {
        this.billingPreview = preview;
        this.loadingBillingPreview = false;
        this.billingPreviewError = preview.concepts_error || '';
        this.selectedInstallments = this.firstAvailableInstallments();
      },
      error: (err) => {
        console.error(err);
        this.loadingBillingPreview = false;
        this.billingPreviewError = err?.error?.message
          || 'No se pudo calcular la vista previa de los cargos.';
      }
    });
  }

  // Primera cantidad de cuotas que si cabe en lo que resta del anio, para no
  // dejar preseleccionada una opcion que el backend va a rechazar.
  private firstAvailableInstallments(): number | null {
    const option = (this.billingPreview?.options || [])
      .find((item) => item.payment_mode === 'cuotas' && item.available);

    return option?.installments_count ?? null;
  }

  get installmentOptions(): EnrollmentBillingPreviewOption[] {
    return (this.billingPreview?.options || []).filter((item) => item.payment_mode === 'cuotas');
  }

  get hasAvailableInstallments(): boolean {
    return this.installmentOptions.some((item) => item.available);
  }

  /** Por que no se puede pagar en cuotas (todas las opciones vienen bloqueadas). */
  get noInstallmentsReason(): string {
    const reason = this.installmentOptions
      .map((item) => item.unavailable_reason)
      .find((value) => !!value);

    return reason || 'No hay cantidades de cuotas disponibles para esta fecha.';
  }

  /** La modalidad que el usuario tiene elegida ahora mismo en el modal. */
  get selectedBillingOption(): EnrollmentBillingPreviewOption | null {
    const options = this.billingPreview?.options || [];

    if (this.selectedPaymentMode === 'contado') {
      return options.find((item) => item.payment_mode === 'contado') || null;
    }

    return options.find((item) =>
      item.payment_mode === 'cuotas' && item.installments_count === this.selectedInstallments) || null;
  }

  get canConfirmApproval(): boolean {
    if (!this.selectedSectionId || this.isBusy(this.selectedApp?.id)) {
      return false;
    }

    // Sin vista previa valida no se deja confirmar: si los conceptos del
    // catalogo estan mal configurados, el backend aprobaria la matricula y se
    // quedaria sin cargos.
    return this.selectedBillingOption?.available === true;
  }

  onPaymentModeChange(mode: EnrollmentPaymentMode): void {
    this.selectedPaymentMode = mode;

    if (mode === 'cuotas' && this.selectedInstallments === null) {
      this.selectedInstallments = this.firstAvailableInstallments();
    }
  }

  onInstallmentsChange(count: number): void {
    this.selectedInstallments = count;
  }

  installmentOptionLabel(option: EnrollmentBillingPreviewOption): string {
    return `${option.installments_count} cuotas`;
  }

  toggleDocumentsChecklist(): void {
    if (!this.detailApplication) {
      return;
    }

    this.showDocumentsChecklist = !this.showDocumentsChecklist;

    if (this.showDocumentsChecklist) {
      this.loadDocumentsChecklist(this.detailApplication.id);
    }
  }

  private loadDocumentsChecklist(applicationId: string): void {
    this.documents = [];
    this.observation = '';
    this.loadingDocuments = true;

    this.documentService.getApplicationDocuments(applicationId).subscribe({
      next: (response) => {
        this.documents = this.extractCollection<ApplicationDocumentChecklistItem>(response);
        this.observation = response?.observation || '';
        this.loadingDocuments = false;
        this.recomputeStatusFromDocuments(applicationId);
      },
      error: (err) => {
        console.error(err);
        this.loadingDocuments = false;
      }
    });
  }

  toggleDocument(doc: ApplicationDocumentChecklistItem): void {
    if (!this.detailApplication || this.savingDocumentId) {
      return;
    }

    const appId = this.detailApplication.id;
    const nextDelivered = !doc.delivered;
    this.savingDocumentId = doc.document_type_id;

    this.documentService.toggleApplicationDocument(appId, doc.document_type_id, nextDelivered).subscribe({
      next: (response) => {
        doc.delivered = nextDelivered;
        doc.delivered_at = response?.data?.delivered_at || null;
        this.savingDocumentId = null;
        this.recomputeStatusFromDocuments(appId);
      },
      error: (err) => {
        this.savingDocumentId = null;
        void Swal.fire('Error', err?.error?.message || 'No se pudo actualizar el documento.', 'error');
      }
    });
  }

  saveObservation(): void {
    if (!this.detailApplication) {
      return;
    }

    const appId = this.detailApplication.id;
    this.savingObservation = true;

    this.documentService.updateEnrollmentObservation(appId, this.observation || null).subscribe({
      next: () => {
        this.savingObservation = false;
      },
      error: (err) => {
        this.savingObservation = false;
        void Swal.fire('Error', err?.error?.message || 'No se pudo guardar la observacion.', 'error');
      }
    });
  }

  get deliveredDocsCount(): number {
    return this.documents.filter((doc) => doc.delivered).length;
  }

  get totalDocsCount(): number {
    return this.documents.length;
  }

  get allDocumentsComplete(): boolean {
    return this.totalDocsCount > 0 && this.deliveredDocsCount === this.totalDocsCount;
  }

  // Recalcula localmente desde el checklist ya cargado (evita otro round-trip
  // al backend) y refresca el punto rojo/verde + el gate del boton Aprobar
  // en la fila de la tabla para esta misma solicitud.
  private recomputeStatusFromDocuments(appId: string): void {
    const requiredDocs = this.documents.filter((doc) => doc.is_required);
    const deliveredRequired = requiredDocs.filter((doc) => doc.delivered).length;

    this.documentsStatusByAppId = {
      ...this.documentsStatusByAppId,
      [appId]: {
        total_required: requiredDocs.length,
        delivered_required: deliveredRequired,
        is_complete: deliveredRequired >= requiredDocs.length,
      },
    };
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
    if (!this.selectedApp || !this.canConfirmApproval) return;

    const paymentMode = this.selectedPaymentMode;
    const installments = paymentMode === 'cuotas' ? this.selectedInstallments : null;

    this.processingApplicationId = this.selectedApp.id;
    this.processingAction = 'approve';

    this.enrollmentService
      .approveApplication(this.selectedApp.id, this.selectedSectionId, paymentMode, installments)
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Solicitud aprobada.';
          const credentials = response?.data?.credentials as EnrollmentProvisionCredentials | null | undefined;
          const credentialsError = response?.data?.credentials_error as string | null | undefined;
          const billingError = response?.data?.billing_error as string | null | undefined;
          const studentId = (response?.data?.student_id as string | null | undefined) || null;

          this.processingApplicationId = null;
          this.processingAction = null;
          const app = this.selectedApp;
          this.closeApproveModal();
          this.loadApplications();

          // Los cargos se generan en su propia transaccion: la matricula puede
          // quedar aprobada y la emision fallar. Si pasa, se avisa con el
          // motivo real y NO se manda a cobrar algo que no existe.
          if (billingError) {
            void Swal.fire({
              icon: 'warning',
              title: 'Matricula aprobada, sin cargos generados',
              text: `${message} No se pudieron generar los cargos: ${billingError} Emitelos desde Finanzas -> Emision Masiva.`,
              confirmButtonText: 'Entendido',
            });
            return;
          }

          const afterNotice = () => this.goToCollectIfCash(paymentMode, studentId);

          if (credentials && app) {
            this.showCredentialsModal(credentials, message, app, afterNotice);
            return;
          }

          if (credentialsError) {
            void Swal.fire({
              icon: 'warning',
              title: 'Matricula aprobada',
              text: `${message} ${credentialsError}`.trim(),
              confirmButtonText: 'Entendido',
            }).then(afterNotice);
            return;
          }

          void Swal.fire({
            icon: 'success',
            title: 'Solicitud aprobada',
            text: message,
            confirmButtonText: 'Aceptar',
          }).then(afterNotice);
        },
        error: (err) => {
          console.error(err);
          this.processingApplicationId = null;
          this.processingAction = null;

          void Swal.fire({
            icon: 'error',
            title: 'No se pudo aprobar',
            // El backend ya redacta el motivo exacto (cuotas que no caben en el
            // anio, conceptos duplicados, seccion de otro grado): se muestra tal
            // cual en vez de un texto generico.
            text: this.extractBackendMessage(err, 'Error al aprobar la solicitud.'),
            confirmButtonText: 'Cerrar',
          });

          // El modal sigue abierto con lo ya elegido: se refresca la vista
          // previa para que secretaria corrija la modalidad sin empezar de cero.
          if (this.selectedApp) {
            this.loadBillingPreview(this.selectedApp.id);
          }
        }
      });
  }

  /**
   * Mensaje real del backend. Un 422 de Laravel trae {message, errors}; para
   * los errores de modalidad el detalle util esta en errors.installments_count
   * / errors.payment_mode, no siempre en message.
   */
  private extractBackendMessage(err: any, fallback: string): string {
    const errors = err?.error?.errors;

    if (errors && typeof errors === 'object') {
      const firstField = Object.keys(errors)[0];
      const firstMessage = Array.isArray(errors[firstField]) ? errors[firstField][0] : null;

      if (firstMessage) {
        return String(firstMessage);
      }
    }

    return err?.error?.message || fallback;
  }

  /**
   * Punto 1.4 del flujo: aprobada al contado, el cargo ya existe y solo falta
   * que secretaria confirme el pago, asi que se la lleva directo a Finanzas ->
   * Cuenta Corriente con el alumno ya seleccionado. En cuotas no se redirige:
   * ahi el cobro es un calendario, no un cobro inmediato.
   */
  private goToCollectIfCash(paymentMode: EnrollmentPaymentMode, studentId: string | null): void {
    if (paymentMode !== 'contado' || !studentId) {
      return;
    }

    void this.router.navigate(['/app/finance/account'], {
      queryParams: { tab: 'student', student_id: studentId },
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
          this.showCredentialsModal(credentials, response?.message || 'Credenciales generadas.', app);
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
      const matchYear = !this.selectedApp?.academic_year_id
        || section.academic_year_id === this.selectedApp.academic_year_id;
      const matchGrade = !this.selectedApp?.grade_level_id
        || section.grade_level_id === this.selectedApp.grade_level_id;
      return matchYear && matchGrade;
    });

    if (this.filteredSections.length === 0 && this.allSections.length === 0) {
      this.loadSections();
    }
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private showCredentialsModal(
    credentials: EnrollmentProvisionCredentials,
    message: string,
    app: EnrollmentApplication,
    onClosed?: () => void
  ): void {
    const studentPassword = credentials.student.generated ? (credentials.student.password || '') : 'Ya existia una cuenta previa';
    const guardianPassword = credentials.guardian.generated ? (credentials.guardian.password || '') : 'Ya existia una cuenta previa';

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
      showDenyButton: true,
      denyButtonText: '💬 Compartir credenciales por WhatsApp',
      denyButtonColor: '#059669',
    }).then((result) => {
      if (result.isDenied) {
        this.shareCredentialsViaWhatsapp(app, credentials);
      }

      // El envio por WhatsApp abre otra pestana, asi que se puede continuar
      // igual (redirigir a cobrar) sin interrumpirlo.
      onClosed?.();
    });
  }

  // Envio 100% manual: solo abre wa.me con el mensaje pre-armado, el admin
  // revisa y presiona enviar. No hay API de pago ni persistencia de las claves.
  shareCredentialsViaWhatsapp(app: EnrollmentApplication, credentials: EnrollmentProvisionCredentials): void {
    const rawPhone = String(app.guardian_phone || '').replace(/\D/g, '');

    if (!rawPhone) {
      void Swal.fire({
        icon: 'warning',
        title: 'Sin numero de WhatsApp',
        text: 'La solicitud no tiene un telefono de apoderado registrado.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const fullPhone = rawPhone.startsWith('51') ? rawPhone : '51' + rawPhone;
    const portalUrl = `${window.location.origin}/login`;

    const lines: string[] = [
      `Hola ${app.guardian_first_name || 'apoderado(a)'},`,
      '',
      '¡Bienvenido a CERMAT! Aqui tienes las credenciales de acceso al sistema:',
      '',
    ];

    if (credentials.student.generated) {
      lines.push(
        `🎓 Cuenta del estudiante (${app.student_first_name || ''}):`,
        `Usuario: ${credentials.student.email}`,
        `Contraseña: ${credentials.student.password || ''}`,
        ''
      );
    } else {
      lines.push(
        `🎓 Cuenta del estudiante (${app.student_first_name || ''}):`,
        `Usuario: ${credentials.student.email} (cuenta ya existente, usa tu contraseña habitual)`,
        ''
      );
    }

    if (credentials.guardian.generated) {
      lines.push(
        '👤 Cuenta del apoderado:',
        `Usuario: ${credentials.guardian.email}`,
        `Contraseña: ${credentials.guardian.password || ''}`,
        ''
      );
    } else {
      lines.push(
        '👤 Cuenta del apoderado:',
        'Tu cuenta de apoderado ya existia, usa tu contraseña habitual.',
        ''
      );
    }

    lines.push(
      `Ingresa en: ${portalUrl}`,
      '',
      'Por seguridad, te recomendamos cambiar tu contraseña al primer ingreso.'
    );

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
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
