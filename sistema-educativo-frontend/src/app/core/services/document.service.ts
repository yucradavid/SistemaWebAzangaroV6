//src/app/core/services/document.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type DocumentLevel = 'inicial' | 'primaria' | 'secundaria';

export interface DocumentType {
  id: string;
  name: string;
  description?: string | null;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  level: DocumentLevel;
}

export interface PublicDocumentType {
  id: string;
  name: string;
  description?: string | null;
  is_required: boolean;
  display_order: number;
}

export interface ApplicationDocumentChecklistItem {
  document_type_id: string;
  name: string;
  description?: string | null;
  is_required: boolean;
  display_order: number;
  delivered: boolean;
  delivered_at?: string | null;
  notes?: string | null;
}

export interface ApplicationDocumentChecklistResponse {
  data: ApplicationDocumentChecklistItem[];
  observation: string | null;
}

export interface ApplicationDocumentsStatus {
  total_required: number;
  delivered_required: number;
  is_complete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  getDocumentTypes(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/document-types`, { params });
  }

  // Publico, sin autenticacion: usado desde el formulario de pre-matricula
  // para sugerir al apoderado que documentos traer segun el nivel elegido.
  // No confundir con el checklist de "entregados" que el admin marca luego.
  getPublicDocumentTypesByLevel(level: DocumentLevel): Observable<{ data: PublicDocumentType[] }> {
    return this.http.get<{ data: PublicDocumentType[] }>(`${this.apiUrl}/public/document-types`, { params: { level } });
  }

  createDocumentType(payload: Partial<DocumentType>): Observable<any> {
    return this.http.post(`${this.apiUrl}/document-types`, payload);
  }

  updateDocumentType(id: string, payload: Partial<DocumentType>): Observable<any> {
    return this.http.put(`${this.apiUrl}/document-types/${id}`, payload);
  }

  deleteDocumentType(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/document-types/${id}`);
  }

  getApplicationDocuments(applicationId: string): Observable<ApplicationDocumentChecklistResponse> {
    return this.http.get<ApplicationDocumentChecklistResponse>(`${this.apiUrl}/enrollment-applications/${applicationId}/documents`);
  }

  toggleApplicationDocument(applicationId: string, documentTypeId: string, delivered: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/enrollment-applications/${applicationId}/documents/${documentTypeId}`, { delivered });
  }

  updateEnrollmentObservation(applicationId: string, observation: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/enrollment-applications/${applicationId}/enrollment-observation`, { enrollment_observation: observation });
  }

  getApplicationDocumentsStatus(applicationId: string): Observable<ApplicationDocumentsStatus> {
    return this.http.get<ApplicationDocumentsStatus>(`${this.apiUrl}/enrollment-applications/${applicationId}/documents-status`);
  }
}
