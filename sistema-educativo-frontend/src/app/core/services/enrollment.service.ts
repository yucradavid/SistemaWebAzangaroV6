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
  grade_level?: {
    id: string;
    name: string;
  };
  academic_year?: {
    id: string;
    year: number;
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

  approveApplication(id: string, sectionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, { section_id: sectionId });
  }

  provisionAccounts(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/provision-accounts`, {});
  }

  rejectApplication(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, { rejection_reason: reason });
  }
}
