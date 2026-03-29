import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type BulkImportType =
  | 'teachers'
  | 'guardians'
  | 'students'
  | 'student_guardians'
  | 'teacher_assignments';

export interface BulkImportSummary {
  total_rows: number;
  valid_rows: number;
  skipped_rows: number;
  error_rows: number;
}

export interface BulkImportPreviewRow {
  row_number: number;
  action: 'create' | 'skip' | 'error';
  messages: string[];
  raw: Record<string, string>;
  normalized?: Record<string, unknown>;
}

export interface BulkImportResponse {
  type: BulkImportType;
  headers: string[];
  summary: BulkImportSummary;
  rows: BulkImportPreviewRow[];
  message?: string;
  created_rows?: number;
  skipped_rows?: number;
}

export interface BulkImportContextPayload {
  section_id?: string;
  course_id?: string;
  default_password?: string;
  auto_enroll_by_section?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BulkImportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bulk-import`;

  preview(type: BulkImportType, file: File, context?: BulkImportContextPayload): Observable<BulkImportResponse> {
    const formData = this.buildFormData(file, context);

    return this.http.post<BulkImportResponse>(`${this.apiUrl}/${type}/preview`, formData);
  }

  import(type: BulkImportType, file: File, context?: BulkImportContextPayload): Observable<BulkImportResponse> {
    const formData = this.buildFormData(file, context);

    return this.http.post<BulkImportResponse>(`${this.apiUrl}/${type}`, formData);
  }

  private buildFormData(file: File, context?: BulkImportContextPayload): FormData {
    const formData = new FormData();
    formData.append('file', file);

    if (context?.section_id) {
      formData.append('section_id', context.section_id);
    }

    if (context?.course_id) {
      formData.append('course_id', context.course_id);
    }

    if (context?.default_password) {
      formData.append('default_password', context.default_password);
    }

    if (context?.auto_enroll_by_section !== undefined) {
      formData.append('auto_enroll_by_section', context.auto_enroll_by_section ? '1' : '0');
    }

    return formData;
  }
}
