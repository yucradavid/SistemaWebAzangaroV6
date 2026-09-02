import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnrollmentApplication {
  id: string;
  student_first_name: string;
  student_last_name: string;
  student_document_type?: string;
  student_document_number: string;
  student_birth_date?: string;
  student_gender?: string;
  student_address?: string | null;
  student_photo_url?: string | null;
  guardian_first_name?: string;
  guardian_last_name?: string;
  guardian_document_type?: string;
  guardian_document_number?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_address?: string | null;
  guardian_relationship?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  grade_level_id: string;
  academic_year_id: string;
  previous_school?: string | null;
  has_special_needs?: boolean;
  special_needs_description?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
  rejection_reason?: string;
  application_date?: string;
  reviewed_at?: string | null;
  created_at: string;
  siblings_detected?: EnrollmentSibling[];
  siblings_count?: number;
  grade_level?: {
    id: string;
    name: string;
  };
  academic_year?: {
    id: string;
    year: number;
  };
}

export interface EnrollmentSibling {
  name: string;
  code: string;
}

export interface GuardianLookupResult {
  found: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  relationship?: string | null;
  siblings_count?: number;
  siblings?: EnrollmentSibling[];
}

export interface ReniecLookupResult {
  success: boolean;
  message?: string;
  data?: {
    dni?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    fecha_nacimiento?: string;
    sexo?: string;
    [key: string]: any;
  };
}

export interface ProvisionedAccountCredential {
  email: string;
  password?: string | null;
  generated: boolean;
  user_id: string;
}

export interface EnrollmentProvisionCredentials {
  student: ProvisionedAccountCredential;
  guardian: ProvisionedAccountCredential;
}

export type EnrollmentPaymentMode = 'contado' | 'cuotas';

export interface EnrollmentBillingPreviewCharge {
  label: string;
  type: 'matricula' | 'pension';
  due_date: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
}

/**
 * Una modalidad posible para la matricula que se esta por aprobar. Las que no
 * caben en lo que resta del anio academico llegan con available=false y el
 * motivo ya redactado por el backend (no se arma ningun mensaje aca).
 */
export interface EnrollmentBillingPreviewOption {
  key: string;
  payment_mode: EnrollmentPaymentMode;
  installments_count: number | null;
  available: boolean;
  unavailable_reason: string | null;
  charges: EnrollmentBillingPreviewCharge[];
  gross_total: number;
  discount_total: number;
  total: number;
  due_today: number;
}

export interface EnrollmentBillingPreview {
  academic_year_id: string;
  academic_year: number;
  reference_date: string;
  installment_options: number[];
  max_installments: number;
  first_scheduled_due_date: string;
  concepts_error: string | null;
  concepts: {
    matricula: { name: string; amount: number };
    pension: { name: string; amount: number };
  } | null;
  auto_discount: {
    id: string;
    name: string;
    type: 'porcentaje' | 'monto_fijo';
    value: number;
    concepts: string[];
  } | null;
  options: EnrollmentBillingPreviewOption[];
}

/** Fila de la vista "Contado pendiente de cobro". */
export interface PendingCashCollectionRow {
  application_id: string;
  student_id: string;
  student_name: string;
  student_code: string | null;
  grade_level: string | null;
  section: string | null;
  guardian_name: string;
  guardian_phone: string | null;
  approved_at: string | null;
  charges_count: number;
  total_due: number;
  total_charged: number;
  total_paid: number;
}

export interface PendingCashCollectionResponse {
  academic_year_id: string | null;
  count: number;
  total_due: number;
  data: PendingCashCollectionRow[];
}

export interface PublicEnrollmentApplicationPayload {
  student_first_name: string;
  student_last_name: string;
  student_document_type: string;
  student_document_number: string;
  student_birth_date: string;
  student_gender: string;
  student_address?: string | null;
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_document_type: string;
  guardian_document_number: string;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  guardian_address?: string | null;
  guardian_relationship?: string | null;
  grade_level_id: string;
  academic_year_id: string;
  previous_school?: string | null;
  has_special_needs?: boolean;
  special_needs_description?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/enrollment-applications`;
  private publicApiUrl = `${environment.apiUrl}/public`;

  getPublicOptions(): Observable<any> {
    return this.http.get(`${this.publicApiUrl}/enrollment-options`);
  }

  guardianLookup(dni: string): Observable<GuardianLookupResult> {
    const params = new HttpParams().set('dni', dni);
    return this.http.get<GuardianLookupResult>(`${this.publicApiUrl}/guardian-lookup`, { params });
  }

  reniecLookup(dni: string): Observable<ReniecLookupResult> {
    const params = new HttpParams().set('dni', dni);
    return this.http.get<ReniecLookupResult>(`${this.publicApiUrl}/reniec-lookup`, { params });
  }

  createPublicApplication(payload: PublicEnrollmentApplicationPayload): Observable<any> {
    return this.http.post(`${this.publicApiUrl}/enrollment-applications`, payload);
  }

  getApplications(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(this.apiUrl, { params: httpParams });
  }

  getApplication(id: string): Observable<EnrollmentApplication> {
    return this.http.get<EnrollmentApplication>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cuanto se le va a cobrar al alumno en cada modalidad. Solo lectura: se
   * consulta al abrir el modal de aprobacion, antes de confirmar nada.
   */
  getBillingPreview(id: string): Observable<EnrollmentBillingPreview> {
    return this.http.get<EnrollmentBillingPreview>(`${this.apiUrl}/${id}/billing-preview`);
  }

  approveApplication(
    id: string,
    sectionId: string,
    paymentMode: EnrollmentPaymentMode,
    installmentsCount?: number | null
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, {
      section_id: sectionId,
      payment_mode: paymentMode,
      // Solo viaja en modalidad cuotas: el backend lo valida con required_if.
      installments_count: paymentMode === 'cuotas' ? installmentsCount : null,
    });
  }

  /** Matriculas aprobadas al contado cuyo cargo todavia no fue cobrado. */
  getPendingCashCollection(academicYearId?: string | null): Observable<PendingCashCollectionResponse> {
    let params = new HttpParams();
    if (academicYearId) {
      params = params.set('academic_year_id', academicYearId);
    }

    return this.http.get<PendingCashCollectionResponse>(`${this.apiUrl}/pending-cash-collection`, { params });
  }

  provisionAccounts(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/provision-accounts`, {});
  }

  rejectApplication(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, { rejection_reason: reason });
  }
}
