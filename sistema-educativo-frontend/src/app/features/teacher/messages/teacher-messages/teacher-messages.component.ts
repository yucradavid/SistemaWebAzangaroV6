//src/app/features/teacher/messages/teacher-messages/teacher-messages.component.ts
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { createIcons, icons } from 'lucide';
import { AcademicService, Course, Section, TeacherCourseAssignment } from '@core/services/academic.service';
import { AuthService } from '@core/services/auth.service';
import { Message, MessageThreadSummary, MessagingService } from '@core/services/messaging.service';

interface TeacherMessageStudent {
  id: string;
  fullName: string;
  studentCode: string;
  sectionId: string;
  sectionLabel: string;
  courseIds: string[];
  courseNames: string[];
  unreadCount: number;
  totalMessages: number;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastSenderRole?: Message['sender_role'] | null;
}

@Component({
  selector: 'app-teacher-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-messages.component.html',
  styleUrls: ['./teacher-messages.component.css']
})
export class TeacherMessagesComponent implements OnInit, AfterViewInit {
  private readonly academicService = inject(AcademicService);
  private readonly messagingService = inject(MessagingService);
  private readonly authService = inject(AuthService);

  @ViewChild('threadViewport') private threadViewport?: ElementRef<HTMLDivElement>;

  teacherAssignments: TeacherCourseAssignment[] = [];
  students: TeacherMessageStudent[] = [];
  filteredStudents: TeacherMessageStudent[] = [];
  messages: Message[] = [];

  selectedStudent: TeacherMessageStudent | null = null;
  selectedCourseId = '';
  selectedSectionId = '';
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

  ngOnInit(): void {
    this.loadTeacherInbox();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  get hasStudents(): boolean {
    return this.filteredStudents.length > 0;
  }

  get hasAssignments(): boolean {
    return this.teacherAssignments.length > 0;
  }

  get courseOptions(): Course[] {
    const uniqueCourses = new Map<string, Course>();

    this.teacherAssignments.forEach((assignment) => {
      if (assignment.course?.id) {
        uniqueCourses.set(assignment.course.id, assignment.course);
      }
    });

    return Array.from(uniqueCourses.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  get sectionOptions(): Section[] {
    const uniqueSections = new Map<string, Section>();

    this.filteredAssignmentsByCourse().forEach((assignment) => {
      if (assignment.section?.id) {
        uniqueSections.set(assignment.section.id, assignment.section);
      }
    });

    return Array.from(uniqueSections.values()).sort((left, right) =>
      (left.section_letter || '').localeCompare(right.section_letter || '')
    );
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
    return this.selectedStudent?.sectionLabel || 'Sin sección asignada';
  }

  get selectedStudentCourses(): string {
    return this.selectedStudent?.courseNames.join(', ') || 'Sin cursos asignados';
  }

  get canSendInlineReply(): boolean {
    return !!this.selectedStudent && !!this.inlineReply.body.trim() && !this.sendingMessage;
  }

  get canSendCompose(): boolean {
    return !!this.newMessage.studentId && !!this.newMessage.body.trim() && !this.sendingMessage;
  }

  onCourseFilterChange(): void {
    const currentSectionIsVisible = this.sectionOptions.some((section) => section.id === this.selectedSectionId);
    if (!currentSectionIsVisible) {
      this.selectedSectionId = '';
    }

    this.loadStudentsAndThreads();
  }

  onSectionFilterChange(): void {
    this.loadStudentsAndThreads();
  }

  openCompose(student?: TeacherMessageStudent): void {
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
        student.courseNames.join(' '),
        student.lastMessagePreview
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  selectStudent(student: TeacherMessageStudent): void {
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
    return message.sender?.user_id === this.currentUserId || (!message.sender && message.sender_role === 'teacher');
  }

  getSenderLabel(message: Message): string {
    if (this.isOwnMessage(message)) {
      return 'Docente';
    }

    return message.sender?.full_name || 'Apoderado';
  }

  getStudentInitial(student: TeacherMessageStudent | null): string {
    return student?.fullName?.charAt(0)?.toUpperCase() || 'E';
  }

  getMessagePreview(student: TeacherMessageStudent): string {
    if (student.lastMessagePreview) {
      return student.lastMessagePreview;
    }

    return 'Abrir conversación con la familia';
  }

  getSelectedStudentForModal(): TeacherMessageStudent | undefined {
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

  private loadTeacherInbox(): void {
    this.loadingContext = true;
    this.contextError = '';

    this.academicService.getTeacherCourseAssignments({ is_active: true, per_page: 200 }).subscribe({
      next: (response) => {
        this.teacherAssignments = this.extractRows<TeacherCourseAssignment>(response)
          .filter((assignment) => !!assignment.course_id && !!assignment.section_id);

        if (!this.teacherAssignments.length) {
          this.loadingContext = false;
          this.students = [];
          this.filteredStudents = [];
          this.contextError = 'No tienes asignaciones activas para usar la mensajería.';
          return;
        }

        this.loadStudentsAndThreads();
      },
      error: (error) => {
        this.loadingContext = false;
        this.contextError = error?.error?.message || 'No se pudo cargar la asignación académica del docente.';
      }
    });
  }

  private loadStudentsAndThreads(): void {
    this.loadingContext = true;
    this.contextError = '';

    const filters: { status: string; per_page: number; course_id?: string; section_id?: string } = {
      status: 'active',
      per_page: 300
    };

    if (this.selectedCourseId) {
      filters.course_id = this.selectedCourseId;
    }

    if (this.selectedSectionId) {
      filters.section_id = this.selectedSectionId;
    }

    forkJoin({
      enrollments: this.academicService.getStudentCourseEnrollments(filters),
      threads: this.messagingService.getMessageThreads(filters)
    }).subscribe({
      next: ({ enrollments, threads }) => {
        const threadMap = new Map<string, MessageThreadSummary>();
        this.extractRows<MessageThreadSummary>(threads).forEach((thread) => {
          threadMap.set(thread.student_id, thread);
        });

        const studentMap = new Map<string, TeacherMessageStudent>();

        this.extractRows<any>(enrollments).forEach((enrollment) => {
          const student = enrollment.student;
          if (!student?.id) {
            return;
          }

          const thread = threadMap.get(student.id);
          const existing = studentMap.get(student.id);
          const courseName = enrollment.course?.name;
          const sectionLabel = this.buildSectionLabel(enrollment.section || thread?.student?.section);
          const sectionId = enrollment.section?.id || enrollment.section_id || thread?.student?.section?.id || '';

          if (!existing) {
            studentMap.set(student.id, {
              id: student.id,
              fullName: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
              studentCode: student.student_code || '',
              sectionId,
              sectionLabel,
              courseIds: enrollment.course_id ? [enrollment.course_id] : [],
              courseNames: courseName ? [courseName] : [],
              unreadCount: thread?.unread_count || 0,
              totalMessages: thread?.total_messages || 0,
              lastMessagePreview: thread?.last_message_preview || '',
              lastMessageAt: thread?.last_message_at || null,
              lastSenderRole: thread?.last_sender_role || null,
            });
            return;
          }

          if (courseName && !existing.courseNames.includes(courseName)) {
            existing.courseNames.push(courseName);
          }

          if (enrollment.course_id && !existing.courseIds.includes(enrollment.course_id)) {
            existing.courseIds.push(enrollment.course_id);
          }

          if (!existing.sectionLabel && sectionLabel) {
            existing.sectionLabel = sectionLabel;
          }

          if (!existing.sectionId && sectionId) {
            existing.sectionId = sectionId;
          }
        });

        this.students = Array.from(studentMap.values()).sort((left, right) => this.compareStudents(left, right));
        this.applySearch();
        this.loadingContext = false;

        if (this.selectedStudent) {
          const updatedSelection = this.students.find((student) => student.id === this.selectedStudent?.id) || null;
          this.selectedStudent = updatedSelection;
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
        this.contextError = error?.error?.message || 'No se pudieron cargar los estudiantes o hilos del docente.';
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

  private compareStudents(left: TeacherMessageStudent, right: TeacherMessageStudent): number {
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

  private filteredAssignmentsByCourse(): TeacherCourseAssignment[] {
    if (!this.selectedCourseId) {
      return this.teacherAssignments;
    }

    return this.teacherAssignments.filter((assignment) => assignment.course_id === this.selectedCourseId);
  }

  private buildMessageContent(subject: string, body: string): string {
    const trimmedSubject = subject.trim();

    if (!trimmedSubject) {
      return body;
    }

    return `Asunto: ${trimmedSubject}\n\n${body}`;
  }

  private buildSectionLabel(section: any): string {
    const gradeLevel = section?.grade_level?.name || section?.gradeLevel?.name || '';
    const sectionLetter = section?.section_letter || section?.name || '';

    if (!gradeLevel && !sectionLetter) {
      return 'Sin sección';
    }

    if (!gradeLevel) {
      return `Sección ${sectionLetter}`;
    }

    if (!sectionLetter) {
      return gradeLevel;
    }

    return `${gradeLevel} - Sección ${sectionLetter}`;
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
