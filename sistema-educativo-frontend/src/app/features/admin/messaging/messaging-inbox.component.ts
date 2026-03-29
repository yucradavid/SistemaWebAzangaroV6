import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService } from '@core/services/academic.service';
import { AuthService } from '@core/services/auth.service';
import { Message, MessagingService } from '@core/services/messaging.service';

type StudentContact = {
  id: string;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  dni?: string;
  section?: {
    name?: string;
    section_letter?: string;
    grade_level?: {
      name?: string;
    };
    gradeLevel?: {
      name?: string;
    };
  } | null;
};

@Component({
  selector: 'app-messaging-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-semibold text-blue-900 tracking-tight">Bandeja de Entrada</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">Mensajería directa con familias y seguimiento por estudiante</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-widest text-slate-500">
            {{ filteredStudents.length }} estudiantes
          </div>
          <div class="px-4 py-2 rounded-2xl border border-blue-100 bg-blue-50 text-xs font-bold uppercase tracking-widest text-blue-700">
            {{ unreadNotifications }} notificaciones sin leer
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[720px]">
        <div class="lg:col-span-4 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-widest">Estudiantes</h2>
              <button
                type="button"
                (click)="loadStudents()"
                class="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:text-blue-900 hover:border-blue-200 transition-all">
                Recargar
              </button>
            </div>

            <div class="relative">
              <input
                [(ngModel)]="studentSearch"
                (ngModelChange)="applyStudentFilter()"
                type="text"
                placeholder="Buscar por nombre, código o DNI"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
              <svg class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div *ngIf="loadingStudents" class="p-8 text-center text-slate-400 text-sm font-medium">
            Cargando estudiantes...
          </div>

          <div *ngIf="!loadingStudents && filteredStudents.length === 0" class="flex-1 p-8 text-center text-slate-400 text-sm font-medium">
            No hay estudiantes disponibles para mensajería.
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <button
              type="button"
              *ngFor="let student of filteredStudents"
              (click)="selectStudent(student)"
              [class]="'w-full text-left p-4 rounded-2xl transition-all border ' + (selectedStudent?.id === student.id ? 'bg-blue-900 text-white border-blue-900 shadow-lg' : 'bg-white text-slate-700 border-slate-100 hover:border-blue-100 hover:bg-blue-50/40')">
              <div class="flex items-start gap-4">
                <div [class]="'w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ' + (selectedStudent?.id === student.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-900')">
                  {{ getInitials(student) }}
                </div>
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="font-bold text-sm tracking-tight uppercase leading-5 truncate">{{ getStudentName(student) }}</h3>
                    <span *ngIf="student.student_code" [class]="'text-[10px] font-bold uppercase tracking-widest ' + (selectedStudent?.id === student.id ? 'text-blue-100' : 'text-slate-400')">
                      {{ student.student_code }}
                    </span>
                  </div>
                  <p [class]="'text-xs font-medium truncate ' + (selectedStudent?.id === student.id ? 'text-blue-100/90' : 'text-slate-500')">
                    {{ getStudentSection(student) || 'Sin sección asignada' }}
                  </p>
                  <p *ngIf="student.dni" [class]="'text-[11px] font-semibold ' + (selectedStudent?.id === student.id ? 'text-blue-100/70' : 'text-slate-400')">
                    DNI: {{ student.dni }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div *ngIf="selectedStudent; else noChat" class="contents">
            <div class="p-6 border-b border-slate-100 bg-slate-50/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                  {{ getInitials(selectedStudent) }}
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-slate-900 tracking-tight uppercase">{{ getStudentName(selectedStudent) }}</h3>
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {{ getStudentSection(selectedStudent) || 'Sin sección asignada' }}
                  </p>
                </div>
              </div>

              <div class="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                {{ messages.length }} mensajes
              </div>
            </div>

            <div *ngIf="loadingMessages" class="p-8 text-center text-slate-400 text-sm font-medium">
              Cargando mensajes...
            </div>

            <div *ngIf="!loadingMessages && messages.length === 0" class="flex-1 flex flex-col items-center justify-center space-y-3 text-center px-8">
              <svg class="w-12 h-12 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p class="text-sm text-slate-500 font-semibold">Todavía no hay mensajes con este estudiante.</p>
              <p class="text-xs text-slate-400 font-medium">Puedes iniciar la conversación desde el cuadro inferior.</p>
            </div>

            <div class="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/10">
              <div *ngFor="let msg of messages" [class]="'flex ' + (isOwnMessage(msg) ? 'justify-end' : 'justify-start')">
                <div
                  [class]="'max-w-[85%] rounded-2xl p-4 shadow-sm ' + (isOwnMessage(msg) ? 'bg-blue-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none')">
                  <div class="flex items-center gap-2 mb-2">
                    <span [class]="'text-[10px] font-bold uppercase tracking-widest ' + (isOwnMessage(msg) ? 'text-blue-100' : 'text-slate-400')">
                      {{ getSenderLabel(msg) }}
                    </span>
                    <span [class]="'text-[10px] font-semibold ' + (isOwnMessage(msg) ? 'text-blue-100/80' : 'text-slate-400')">
                      {{ msg.created_at | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                  </div>
                  <p class="text-sm font-medium leading-relaxed whitespace-pre-line">{{ msg.content }}</p>
                </div>
              </div>
            </div>

            <div class="p-6 border-t border-slate-100 bg-white">
              <div class="flex items-end gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                <textarea
                  [(ngModel)]="newMessage"
                  [disabled]="sendingMessage"
                  placeholder="Escribe un mensaje para la familia..."
                  rows="2"
                  class="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium py-3 px-3 resize-none custom-scrollbar"
                  (keydown.enter)="$event.preventDefault(); sendMessage()"></textarea>
                <button
                  type="button"
                  (click)="sendMessage()"
                  class="p-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100"
                  [disabled]="!newMessage.trim() || sendingMessage">
                  <svg *ngIf="!sendingMessage" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  <span *ngIf="sendingMessage" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noChat>
            <div class="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-fade-in">
              <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900 tracking-tight">Centro de mensajes</h3>
                <p class="text-slate-500 text-sm mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                  Selecciona un estudiante para revisar su historial y comunicarte con su familia.
                </p>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class MessagingInboxComponent implements OnInit {
  private readonly messagingService = inject(MessagingService);
  private readonly academicService = inject(AcademicService);
  private readonly authService = inject(AuthService);

  newMessage = '';
  studentSearch = '';
  selectedStudent: StudentContact | null = null;

  students: StudentContact[] = [];
  filteredStudents: StudentContact[] = [];
  messages: Message[] = [];

  loadingStudents = false;
  loadingMessages = false;
  sendingMessage = false;
  unreadNotifications = 0;

  private readonly currentUserId = this.authService.currentUser()?.id ?? '';
  private readonly currentUserRole = this.mapFrontendRoleToBackend(this.authService.getRole() ?? 'admin');

  ngOnInit(): void {
    this.loadStudents();
    this.loadUnreadNotifications();
  }

  loadStudents(): void {
    this.loadingStudents = true;

    this.academicService.getStudents({ per_page: 200 }).subscribe({
      next: (response) => {
        this.students = this.extractCollection<StudentContact>(response);
        this.applyStudentFilter();

        if (!this.selectedStudent && this.filteredStudents.length > 0) {
          this.selectStudent(this.filteredStudents[0]);
        }

        if (this.selectedStudent) {
          const refreshedSelection = this.students.find(student => student.id === this.selectedStudent?.id);
          if (refreshedSelection) {
            this.selectedStudent = refreshedSelection;
          }
        }

        this.loadingStudents = false;
      },
      error: () => {
        this.loadingStudents = false;
      }
    });
  }

  loadUnreadNotifications(): void {
    this.messagingService.getNotifications({ status: 'no_leida' }).subscribe({
      next: (response) => {
        this.unreadNotifications = response.total ?? this.extractCollection(response).length;
      },
      error: () => {
        this.unreadNotifications = 0;
      }
    });
  }

  applyStudentFilter(): void {
    const query = this.studentSearch.trim().toLowerCase();

    if (!query) {
      this.filteredStudents = [...this.students];
      return;
    }

    this.filteredStudents = this.students.filter((student) => {
      const haystack = [
        this.getStudentName(student),
        student.student_code,
        student.dni,
        this.getStudentSection(student),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  selectStudent(student: StudentContact): void {
    this.selectedStudent = student;
    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.selectedStudent) {
      return;
    }

    this.loadingMessages = true;

    this.messagingService.getMessages({ student_id: this.selectedStudent.id }).subscribe({
      next: (response) => {
        this.messages = this.extractCollection<Message>(response).sort((left, right) => {
          const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
          const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
          return leftTime - rightTime;
        });

        this.markIncomingMessagesAsRead();
        this.loadingMessages = false;
      },
      error: () => {
        this.loadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();

    if (!content || !this.selectedStudent) {
      return;
    }

    this.sendingMessage = true;

    this.messagingService.sendMessage({
      student_id: this.selectedStudent.id,
      content,
    }).subscribe({
      next: (message) => {
        this.messages = [...this.messages, message];
        this.newMessage = '';
        this.sendingMessage = false;
      },
      error: () => {
        this.sendingMessage = false;
      }
    });
  }

  isOwnMessage(message: Message): boolean {
    return message.sender?.user_id === this.currentUserId || message.sender_role === this.currentUserRole;
  }

  getSenderLabel(message: Message): string {
    if (this.isOwnMessage(message)) {
      return 'Institución';
    }

    return message.sender?.full_name || this.formatRoleLabel(message.sender_role);
  }

  getStudentName(student: StudentContact | null): string {
    if (!student) {
      return 'Estudiante';
    }

    return student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Estudiante';
  }

  getStudentSection(student: StudentContact | null): string {
    const gradeName = student?.section?.grade_level?.name || student?.section?.gradeLevel?.name;
    const sectionLabel = student?.section?.name || student?.section?.section_letter;

    if (!gradeName && !sectionLabel) {
      return '';
    }

    if (!gradeName) {
      return `Sección ${sectionLabel}`;
    }

    if (!sectionLabel) {
      return gradeName;
    }

    return `${gradeName} - Sección ${sectionLabel}`;
  }

  getInitials(student: StudentContact | null): string {
    const parts = this.getStudentName(student)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);

    return parts.map(part => part.charAt(0)).join('').toUpperCase() || 'ST';
  }

  private markIncomingMessagesAsRead(): void {
    const unreadIncomingMessages = this.messages.filter((message) => !message.is_read && !this.isOwnMessage(message));

    unreadIncomingMessages.forEach((message) => {
      message.is_read = true;

      this.messagingService.markAsRead(message.id, { is_read: true }).subscribe({
        error: () => {
          message.is_read = false;
        }
      });
    });
  }

  private extractCollection<T>(response: { data?: T[] } | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data ?? [];
  }

  private mapFrontendRoleToBackend(role: string): string {
    if (role === 'apoderado') {
      return 'guardian';
    }

    return role;
  }

  private formatRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      director: 'Director',
      coordinator: 'Coordinación',
      secretary: 'Secretaría',
      teacher: 'Docente',
      guardian: 'Apoderado',
    };

    return labels[role] || 'Usuario';
  }
}
