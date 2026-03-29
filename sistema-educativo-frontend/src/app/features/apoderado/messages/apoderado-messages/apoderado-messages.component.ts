//src/app/features/apoderado/messages/apoderado-messages/apoderado-messages.component.ts
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { Message, MessageThreadSummary, MessagingService } from '@core/services/messaging.service';

interface GuardianMessageStudent {
  id: string;
  fullName: string;
  studentCode: string;
  sectionLabel: string;
  unreadCount: number;
  totalMessages: number;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastSenderRole?: Message['sender_role'] | null;
}

@Component({
  selector: 'app-apoderado-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apoderado-messages.component.html',
  styleUrls: ['./apoderado-messages.component.css']
})
export class ApoderadoMessagesComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);

  @ViewChild('threadViewport') private threadViewport?: ElementRef<HTMLDivElement>;

  students: GuardianMessageStudent[] = [];
  filteredStudents: GuardianMessageStudent[] = [];
  messages: Message[] = [];

  selectedStudent: GuardianMessageStudent | null = null;
  searchTerm = '';
  loadingContext = false;
  loadingMessages = false;
  sendingMessage = false;
  contextError = '';
  conversationError = '';
  sendError = '';

  inlineReply = {
    subject: '',
    body: ''
  };

  isComposeOpen = false;
  newMessage = {
    studentId: '',
    subject: '',
    body: ''
  };

  private readonly currentUserId = this.authService.currentUser()?.id ?? '';
  private contextStudents: AcademicContextStudent[] = [];

  ngOnInit(): void {
    this.loadGuardianInbox();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  get hasStudents(): boolean {
    return this.filteredStudents.length > 0;
  }

  get totalUnreadMessages(): number {
    return this.students.reduce((total, student) => total + student.unreadCount, 0);
  }

  get unreadThreads(): number {
    return this.students.filter((student) => student.unreadCount > 0).length;
  }

  get studentsWithHistory(): number {
    return this.students.filter((student) => student.totalMessages > 0).length;
  }

  get selectedStudentName(): string {
    return this.selectedStudent?.fullName || 'Estudiante';
  }

  get selectedStudentSection(): string {
    return this.selectedStudent?.sectionLabel || 'Sin seccion asignada';
  }

  get canSendInlineReply(): boolean {
    return !!this.selectedStudent && !!this.inlineReply.body.trim() && !this.sendingMessage;
  }

  get canSendCompose(): boolean {
    return !!this.newMessage.studentId && !!this.newMessage.body.trim() && !this.sendingMessage;
  }

  openCompose(student?: GuardianMessageStudent): void {
    this.sendError = '';
    this.isComposeOpen = true;
    this.newMessage = {
      studentId: student?.id || this.selectedStudent?.id || '',
      subject: '',
      body: ''
    };
    this.refreshIcons();
  }

  closeCompose(): void {
    this.isComposeOpen = false;
    this.newMessage = {
      studentId: '',
      subject: '',
      body: ''
    };
  }

  applySearch(): void {
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      this.filteredStudents = [...this.students];
      return;
    }

    this.filteredStudents = this.students.filter((student) => {
      const haystack = [
        student.fullName,
        student.studentCode,
        student.sectionLabel,
        student.lastMessagePreview
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  selectStudent(student: GuardianMessageStudent): void {
    this.selectedStudent = student;
    this.inlineReply = { subject: '', body: '' };
    this.loadMessages(student.id);
  }

  sendInlineReply(): void {
    if (!this.selectedStudent) {
      return;
    }

    this.sendMessageToStudent(this.selectedStudent.id, this.inlineReply.subject, this.inlineReply.body, 'inline');
  }

  sendMessage(): void {
    this.sendMessageToStudent(this.newMessage.studentId, this.newMessage.subject, this.newMessage.body, 'compose');
  }

  isOwnMessage(message: Message): boolean {
    return message.sender?.user_id === this.currentUserId || (!message.sender && message.sender_role === 'guardian');
  }

  getSenderLabel(message: Message): string {
    if (this.isOwnMessage(message)) {
      return 'Apoderado';
    }

    return message.sender?.full_name || 'Docente';
  }

  getStudentInitial(student: GuardianMessageStudent | null): string {
    return student?.fullName?.charAt(0)?.toUpperCase() || 'E';
  }

  getMessagePreview(student: GuardianMessageStudent): string {
    if (student.lastMessagePreview) {
      return student.lastMessagePreview;
    }

    return 'Iniciar conversacion con el docente';
  }

  getSelectedStudentForModal(): GuardianMessageStudent | undefined {
    return this.students.find((student) => student.id === this.newMessage.studentId);
  }

  formatThreadTimestamp(value: string | null): string {
    if (!value) {
      return 'Sin mensajes';
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private loadGuardianInbox(): void {
    this.loadingContext = true;
    this.contextError = '';

    this.authService.getAcademicContext().subscribe({
      next: (context) => {
        this.contextStudents = context.students || [];

        if (!this.contextStudents.length) {
          this.loadingContext = false;
          this.students = [];
          this.filteredStudents = [];
          this.contextError = 'Tu usuario no tiene estudiantes vinculados para usar la mensajeria.';
          return;
        }

        this.loadThreads();
      },
      error: (error) => {
        this.loadingContext = false;
        this.contextError = error?.error?.message || 'No se pudo cargar el contexto academico del apoderado.';
      }
    });
  }

  private loadThreads(): void {
    this.loadingContext = true;
    this.contextError = '';

    this.messagingService.getMessageThreads().subscribe({
      next: (response) => {
        const threadMap = new Map<string, MessageThreadSummary>();
        this.extractRows<MessageThreadSummary>(response).forEach((thread) => {
          threadMap.set(thread.student_id, thread);
        });

        this.students = this.contextStudents.map((student) => {
          const thread = threadMap.get(student.id);

          return {
            id: student.id,
            fullName: student.full_name,
            studentCode: student.student_code || '',
            sectionLabel: this.buildSectionLabel(student.section),
            unreadCount: thread?.unread_count || 0,
            totalMessages: thread?.total_messages || 0,
            lastMessagePreview: thread?.last_message_preview || '',
            lastMessageAt: thread?.last_message_at || null,
            lastSenderRole: thread?.last_sender_role || null,
          };
        }).sort((left, right) => this.compareStudents(left, right));

        this.applySearch();
        this.loadingContext = false;

        if (this.selectedStudent) {
          this.selectedStudent = this.students.find((student) => student.id === this.selectedStudent?.id) || null;
        }

        if (!this.selectedStudent && this.filteredStudents.length > 0) {
          this.selectStudent(this.filteredStudents[0]);
        } else if (!this.selectedStudent) {
          this.messages = [];
        }

        this.refreshIcons();
      },
      error: (error) => {
        this.loadingContext = false;
        this.contextError = error?.error?.message || 'No se pudieron cargar los hilos del apoderado.';
      }
    });
  }

  private loadMessages(studentId: string): void {
    this.loadingMessages = true;
    this.conversationError = '';

    this.messagingService.getMessages({ student_id: studentId }).subscribe({
      next: (response) => {
        this.messages = this.extractRows<Message>(response).sort((left, right) => {
          const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
          const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
          return leftTime - rightTime;
        });

        this.markIncomingMessagesAsRead(studentId);
        this.loadingMessages = false;
        this.scrollThreadToBottom();
        this.refreshIcons();
      },
      error: (error) => {
        this.loadingMessages = false;
        this.conversationError = error?.error?.message || 'No se pudo cargar el historial de mensajes.';
      }
    });
  }

  private markIncomingMessagesAsRead(studentId: string): void {
    const unreadMessages = this.messages.filter((message) => !message.is_read && !this.isOwnMessage(message));

    if (!unreadMessages.length) {
      this.clearUnreadState(studentId);
      return;
    }

    unreadMessages.forEach((message) => {
      message.is_read = true;

      this.messagingService.markAsRead(message.id, { is_read: true }).subscribe({
        error: () => {
          message.is_read = false;
        }
      });
    });

    this.clearUnreadState(studentId);
  }

  private sendMessageToStudent(studentId: string, subject: string, body: string, source: 'inline' | 'compose'): void {
    const trimmedBody = body.trim();
    if (!studentId || !trimmedBody || this.sendingMessage) {
      return;
    }

    this.sendError = '';
    this.sendingMessage = true;

    this.messagingService.sendMessage({
      student_id: studentId,
      content: this.buildMessageContent(subject, trimmedBody)
    }).subscribe({
      next: (message) => {
        this.sendingMessage = false;
        this.applyLocalThreadUpdate(message);

        if (source === 'inline') {
          this.inlineReply = { subject: '', body: '' };
        } else {
          this.closeCompose();
        }

        this.scrollThreadToBottom();
        this.refreshIcons();
      },
      error: (error) => {
        this.sendingMessage = false;
        this.sendError = error?.error?.message || 'No se pudo enviar el mensaje.';
      }
    });
  }

  private applyLocalThreadUpdate(message: Message): void {
    const recipient = this.students.find((student) => student.id === message.student_id) || null;
    const preview = this.extractPreview(message.content);
    const timestamp = message.created_at || new Date().toISOString();

    if (recipient) {
      recipient.lastMessagePreview = preview;
      recipient.lastMessageAt = timestamp;
      recipient.totalMessages += 1;
      recipient.lastSenderRole = message.sender_role;
      recipient.unreadCount = 0;
    }

    this.students = [...this.students].sort((left, right) => this.compareStudents(left, right));
    this.applySearch();

    if (this.selectedStudent?.id === message.student_id) {
      this.messages = [...this.messages, message];
      this.selectedStudent = recipient;
      return;
    }

    if (recipient) {
      this.selectedStudent = recipient;
      this.loadMessages(recipient.id);
    }
  }

  private clearUnreadState(studentId: string): void {
    const student = this.students.find((item) => item.id === studentId);
    if (!student) {
      return;
    }

    student.unreadCount = 0;
    this.students = [...this.students].sort((left, right) => this.compareStudents(left, right));
    this.applySearch();
  }

  private compareStudents(left: GuardianMessageStudent, right: GuardianMessageStudent): number {
    if (right.unreadCount !== left.unreadCount) {
      return right.unreadCount - left.unreadCount;
    }

    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.fullName.localeCompare(right.fullName);
  }

  private buildMessageContent(subject: string, body: string): string {
    const trimmedSubject = subject.trim();

    if (!trimmedSubject) {
      return body;
    }

    return `Asunto: ${trimmedSubject}\n\n${body}`;
  }

  private buildSectionLabel(section: AcademicContextStudent['section'] | null | undefined): string {
    const gradeLevel = section?.grade_level?.name || '';
    const sectionLetter = section?.section_letter || '';

    if (!gradeLevel && !sectionLetter) {
      return 'Sin seccion';
    }

    if (!gradeLevel) {
      return `Seccion ${sectionLetter}`;
    }

    if (!sectionLetter) {
      return gradeLevel;
    }

    return `${gradeLevel} - Seccion ${sectionLetter}`;
  }

  private extractPreview(content: string): string {
    return content.replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  private extractRows<T>(response: { data?: T[] } | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data || [];
  }

  private scrollThreadToBottom(): void {
    setTimeout(() => {
      const viewport = this.threadViewport?.nativeElement;
      if (!viewport) {
        return;
      }

      viewport.scrollTop = viewport.scrollHeight;
    }, 0);
  }

  private refreshIcons(): void {
    setTimeout(() => createIcons({ icons }), 0);
  }
}
