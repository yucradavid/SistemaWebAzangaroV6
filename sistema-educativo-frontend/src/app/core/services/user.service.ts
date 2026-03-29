import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models/user.model';

export interface UserProfile {
  id: string;
  user_id: string;
  role: string | UserRole;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface User {
  id: string;
  name: string;
  last_name?: string;
  email: string;
  role: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  dni?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  hire_date?: string;
  birth_date?: string;
  gender?: string;
  section_id?: string;
  enrollment_date?: string;
  relationship?: string;
  is_primary?: boolean;
  related_guardian_id?: string;
  related_student_id?: string;
  relationship_is_primary?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/profiles`;
  private usersUrl = `${environment.apiUrl}/users`;

  getProfiles(params?: { role?: string; is_active?: boolean; q?: string; page?: number; per_page?: number }): Observable<PaginatedResponse<UserProfile>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.role && params.role !== 'Todos') httpParams = httpParams.set('role', params.role.toLowerCase());
      if (params.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.per_page) httpParams = httpParams.set('per_page', params.per_page);
    }

    return this.http.get<PaginatedResponse<UserProfile>>(this.apiUrl, { params: httpParams });
  }

  getUsersByRole(role: string): Observable<any> {
    return this.http.get(`${this.usersUrl}?role=${role}`);
  }

  createUser(userData: CreateUserPayload): Observable<any> {
    return this.http.post(this.usersUrl, userData);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.usersUrl}/${userId}`);
  }

  updateProfile(id: string, profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, profileData);
  }

  deleteProfile(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
