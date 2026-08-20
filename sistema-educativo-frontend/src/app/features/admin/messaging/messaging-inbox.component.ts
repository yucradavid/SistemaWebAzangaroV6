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
  templateUrl: './messaging-inbox.component.html',
  styleUrls: ['./messaging-inbox.component.css']
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
