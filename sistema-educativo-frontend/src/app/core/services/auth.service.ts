import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../models/user.model';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profile: {
      role: string;
      full_name?: string;
    };
  };
}

export interface AcademicContextStudent {
  id: string;
  student_code: string;
  full_name: string;
  section_id?: string | null;
  section?: {
    id: string;
    section_letter?: string;
    grade_level?: {
      id: string;
      name: string;
      level: string;
      grade: number;
    } | null;
  } | null;
}

export interface AcademicContextResponse {
  user: any;
  role: string | null;
  active_academic_year: {
    id: string;
    year: number;
    start_date?: string;
    end_date?: string;
    is_active: boolean;
  } | null;
  students: AcademicContextStudent[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'cermat_user_data';
  private readonly TOKEN_KEY = 'cermat_auth_token';
  
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUser = signal<User | null>(this.getStoredUser());

  constructor() {
    // Optional: Refresh session from backend on init
    this.checkSession();
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  login(credentials: { email: string; password?: string }): Observable<{success: boolean; error?: string}> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/login`, credentials).pipe(
      map(response => {
        const user = this.mapBackendUser(response.user);
        this.setSession(response.token, user);
        return { success: true };
      }),
      catchError(err => {
        console.error('Login error:', err);
        const message = err.error?.message || 'Error al conectar con el servidor.';
        return of({ success: false, error: message });
      })
    );
  }

  private checkSession() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;

    this.http.get<{user: any}>(`${environment.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const user = this.mapBackendUser(res.user);
        this.updateUserState(user);
      },
      error: () => this.logout()
    });
  }

  getAcademicContext(): Observable<AcademicContextResponse> {
    return this.http.get<AcademicContextResponse>(`${environment.apiUrl}/me/academic-context`);
  }

  private mapBackendUser(backendUser: any): User {
    let role: UserRole = 'student';
    const backendRole = backendUser.profile?.role;
    const directRoles: UserRole[] = [
      'admin',
      'director',
      'coordinator',
      'secretary',
      'teacher',
      'student',
      'cashier',
      'administrative',
      'finance',
      'web_editor'
    ];

    if (backendRole === 'guardian') {
      role = 'apoderado';
    } else if (directRoles.includes(backendRole as UserRole)) {
      role = backendRole as UserRole;
    }

    return {
      id: backendUser.id,
      email: backendUser.email,
      name: backendUser.profile?.full_name || backendUser.name || 'Usuario',
      role: role
    };
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateUserState(user);
  }

  private updateUserState(user: User | null): void {
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
  }

  getHomeRoute(role: UserRole | null = this.getRole()): string {
    switch (role) {
      case 'student':
        return '/app/dashboard/student';
      case 'teacher':
        return '/app/dashboard/teacher';
      case 'apoderado':
      case 'guardian':
        return '/app/dashboard/apoderado';
      default:
        return '/app/dashboard';
    }
  }

  isAdminWorkspaceRole(role: UserRole | null = this.getRole()): boolean {
    return !['student', 'teacher', 'apoderado', 'guardian'].includes((role || '') as string);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateUserState(null);
    this.router.navigate(['/login']);
  }

  getRole(): UserRole | null {
    return this.currentUserSubject.value?.role || null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
