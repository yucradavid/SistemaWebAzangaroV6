//src/app/features/apoderado/communications/apoderado-communications/apoderado-communications.component.ts
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createIcons, icons } from 'lucide';
import { forkJoin } from 'rxjs';
import { AcademicContextStudent, AuthService } from '@core/services/auth.service';
import { Announcement, MessagingService } from '@core/services/messaging.service';

@Component({
  selector: 'app-apoderado-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apoderado-communications.component.html',
  styleUrls: ['./apoderado-communications.component.css']
})
export class ApoderadoCommunicationsComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);

  students: AcademicContextStudent[] = [];
  communications: Announcement[] = [];
  selectedStudentId = '';
  selectedAudience = '';
  searchTerm = '';
  loading = false;
  error = '';
  selectedAnnouncement: Announcement | null = null;

  readonly audienceOptions = [
    { value: '', label: 'Todas las audiencias' },
    { value: 'todos', label: 'Toda la institucion' },
    { value: 'apoderados', label: 'Apoderados' },
    { value: 'estudiantes', label: 'Estudiantes' },
    { value: 'seccion_especifica', label: 'Seccion especifica' },
  ];

  ngOnInit(): void {
    this.loadCommunications();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  get filteredCommunications(): Announcement[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.communications.filter((announcement) => {
      if (this.selectedAudience && announcement.audience !== this.selectedAudience) {
        return false;
      }

      if (!this.matchesSelectedStudent(announcement)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        announcement.title,
        announcement.content,
        this.getCreatorLabel(announcement),
        this.getAudienceLabel(announcement),
        this.getMatchedStudentsLabel(announcement),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get newCount(): number {
    return this.filteredCommunications.filter((announcement) => this.isNew(announcement)).length;
  }

  get sectionCount(): number {
    return this.filteredCommunications.filter((announcement) => announcement.audience === 'seccion_especifica').length;
  }

  get selectedStudent(): AcademicContextStudent | null {
    return this.students.find((student) => student.id === this.selectedStudentId) || null;
  }

  trackByAnnouncement(_index: number, announcement: Announcement): string {
    return announcement.id;
  }

  resetFilters(): void {
    this.selectedStudentId = '';
    this.selectedAudience = '';
    this.searchTerm = '';
  }

  openAnnouncement(announcement: Announcement): void {
    this.selectedAnnouncement = announcement;
    this.refreshIcons();
  }

  closeAnnouncement(): void {
    this.selectedAnnouncement = null;
  }

  getCreatorLabel(announcement: Announcement): string {
    return announcement.creator?.full_name || 'Institucion';
  }

  getAudienceLabel(announcement: Announcement): string {
    const labels: Record<string, string> = {
      todos: 'Toda la institucion',
      apoderados: 'Apoderados',
      estudiantes: 'Estudiantes',
      docentes: 'Docentes',
      seccion_especifica: this.getMatchedStudentsLabel(announcement),
    };

    return labels[announcement.audience] || 'Comunicado';
  }

  getMatchedStudentsLabel(announcement: Announcement): string {
    if (announcement.audience !== 'seccion_especifica') {
      return 'Comunicado general';
    }

    const sectionId = announcement.section_id || announcement.section?.id;
    const matchingStudents = this.students.filter((student) => (student.section_id || student.section?.id) === sectionId);

    if (!matchingStudents.length) {
      const grade = announcement.section?.grade_level?.name || announcement.section?.gradeLevel?.name || '';
      const section = announcement.section?.section_letter || announcement.section?.name || '';
      return [grade, section ? `Seccion ${section}` : ''].filter(Boolean).join(' - ') || 'Seccion especifica';
    }

    return matchingStudents.map((student) => student.full_name).join(', ');
  }

  getDateLabel(announcement: Announcement): string {
    const source = announcement.published_at || announcement.created_at;
    if (!source) {
      return 'Fecha no disponible';
    }

    const date = new Date(source);
    if (Number.isNaN(date.getTime())) {
      return source;
    }

    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isNew(announcement: Announcement): boolean {
    const source = announcement.published_at || announcement.created_at;
    if (!source) {
      return false;
    }

    const publishedAt = new Date(source).getTime();
    if (Number.isNaN(publishedAt)) {
      return false;
    }

    return Date.now() - publishedAt <= 1000 * 60 * 60 * 72;
  }

  private loadCommunications(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      context: this.authService.getAcademicContext(),
      announcements: this.messagingService.getAnnouncements({ status: 'publicado' })
    }).subscribe({
      next: ({ context, announcements }) => {
        this.students = context.students || [];
        this.communications = (announcements.data || [])
          .map((announcement) => ({
            ...announcement,
            id: typeof announcement.id === 'string' ? announcement.id : String(announcement.id ?? '')
          }))
          .sort((left, right) => this.getAnnouncementTimestamp(right) - this.getAnnouncementTimestamp(left));

        this.loading = false;
        this.refreshIcons();
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'No se pudieron cargar los comunicados del apoderado.';
      }
    });
  }

  private matchesSelectedStudent(announcement: Announcement): boolean {
    if (!this.selectedStudentId) {
      return true;
    }

    if (announcement.audience !== 'seccion_especifica') {
      return true;
    }

    const student = this.selectedStudent;
    if (!student) {
      return false;
    }

    const studentSectionId = student.section_id || student.section?.id;
    const announcementSectionId = announcement.section_id || announcement.section?.id;

    return !!studentSectionId && studentSectionId === announcementSectionId;
  }

  private getAnnouncementTimestamp(announcement: Announcement): number {
    const source = announcement.published_at || announcement.created_at;
    const date = source ? new Date(source) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  }

  private refreshIcons(): void {
    setTimeout(() => createIcons({ icons }), 0);
  }
}
