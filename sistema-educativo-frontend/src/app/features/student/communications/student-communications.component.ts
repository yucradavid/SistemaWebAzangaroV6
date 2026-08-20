//src/app/features/student/communications/student-communications.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';
import { Announcement, MessagingService } from '@core/services/messaging.service';

interface Communication {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'media' | 'urgente';
  author: string;
  category: string;
  read: boolean;
}

@Component({
  selector: 'app-communications-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-communications.component.html',
  styleUrls: ['./student-communications.component.css']
})
export class CommunicationsStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private messagingService = inject(MessagingService);

  loading = false;
  activeTab = 'all';
  searchQuery = '';
  priorityFilter = 'all';
  selectedComm: Communication | null = null;
  error = '';

  allComms: Communication[] = [];
  filteredComms: Communication[] = [];

  ngOnInit() {
    this.loadCommunications();
  }

  loadCommunications() {
    this.loading = true;
    this.error = '';

    this.messagingService.getAnnouncements({ status: 'publicado' }).subscribe({
      next: (response) => {
        this.allComms = (response.data || [])
          .map((announcement) => this.mapAnnouncementToCommunication(announcement))
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

        this.filterCommunications();
        this.loading = false;
      },
      error: (error) => {
        this.allComms = [];
        this.filteredComms = [];
        this.loading = false;
        this.error = error?.error?.message || 'No se pudieron cargar los comunicados.';
      }
    });
  }

  getNewCount(): number {
    return this.allComms.filter(c => this.isNew(c)).length;
  }

  getHighPriorityCount(): number {
    return this.allComms.filter(c => c.priority === 'urgente').length;
  }

  isNew(comm: Communication): boolean {
    const publishedDate = new Date(comm.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return publishedDate > threeDaysAgo;
  }

  getPriorityStyles(priority: string): string {
    const map: Record<string, string> = {
      urgente: 'bg-red-50 text-red-600 border border-red-100',
      media: 'bg-orange-50 text-orange-600 border border-orange-100',
      normal: 'bg-slate-50 text-slate-500 border border-slate-100',
    };
    return map[priority] || map['normal'];
  }

  filterCommunications() {
    let filtered = [...this.allComms];

    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === this.priorityFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query)
      );
    }

    this.filteredComms = filtered;
  }

  getSafeIcon(name: string): SafeHtml {
    const map: Record<string, string> = {
      megaphone: ICONS.megaphone,
      sparkles: ICONS.sparkles,
      alertTriangle: ICONS.alertTriangle,
      filter: ICONS.filter,
      inbox: ICONS.inbox,
      eye: ICONS.eye,
      search: ICONS.search
    };
    const svg = map[name] || ICONS.newspaper;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  openComm(comm: Communication) {
    this.selectedComm = comm;
    comm.read = true;
    this.filterCommunications();
  }

  private mapAnnouncementToCommunication(announcement: Announcement): Communication {
    return {
      id: typeof announcement.id === 'string' ? announcement.id : String(announcement.id ?? ''),
      title: announcement.title || 'Comunicado',
      content: announcement.content || '',
      date: announcement.published_at || announcement.created_at || new Date().toISOString(),
      priority: this.mapPriority(announcement.priority),
      author: announcement.creator?.full_name || announcement.creator?.user?.name || 'Institucion',
      category: this.getAudienceLabel(announcement),
      read: false
    };
  }

  private mapPriority(priority: string | null | undefined): Communication['priority'] {
    const normalized = String(priority || '').toLowerCase();

    if (normalized === 'urgente' || normalized === 'alta' || normalized === 'high') {
      return 'urgente';
    }

    if (normalized === 'media' || normalized === 'medio' || normalized === 'medium') {
      return 'media';
    }

    return 'normal';
  }

  private getAudienceLabel(announcement: Announcement): string {
    if (announcement.audience === 'seccion_especifica') {
      const gradeName = announcement.section?.grade_level?.name || announcement.section?.gradeLevel?.name || '';
      const sectionLetter = announcement.section?.section_letter || announcement.section?.name || '';

      return [gradeName, sectionLetter ? `Seccion ${sectionLetter}` : '']
        .filter(Boolean)
        .join(' - ') || 'Seccion especifica';
    }

    const labels: Record<string, string> = {
      todos: 'Toda la institucion',
      estudiantes: 'Estudiantes',
      apoderados: 'Apoderados',
      docentes: 'Docentes'
    };

    return labels[announcement.audience] || 'Comunicado';
  }
}
