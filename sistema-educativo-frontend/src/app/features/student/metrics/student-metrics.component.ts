import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ICONS } from '@core/constants/icons';

interface Metric {
  label: string;
  value: string;
  subValue: string;
  icon: string;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  percent?: number;
}

@Component({
  selector: 'app-metrics-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BackButtonComponent],
  templateUrl: './student-metrics.component.html',
  styleUrls: ['./student-metrics.component.css']
})
export class MetricsStudentComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  
  loading = false;

  assignments = {
    today: [
      { id: '1', title: 'Práctica de Logaritmos', courseName: 'Matemática y Lógica', dueDate: new Date().toISOString() }
    ],
    thisWeek: [
      { id: '2', title: 'Ensayo sobre Cien años de soledad', courseName: 'Comunicación y Literatura', dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
      { id: '3', title: 'Laboratorio de Célula vegetal', courseName: 'Ciencia y Tecnología', dueDate: new Date(Date.now() + 86400000 * 4).toISOString() }
    ],
    overdue: [
      { id: '4', title: 'Cuestionario de Historia Universal', courseName: 'Ciencia y Tecnología', dueDate: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  attendanceStats = {
    presente: 24,
    tarde: 3,
    falta: 1,
    total: 28
  };

  areas = [
    { name: 'Matemática y Lógica', percent: 88, color: 'bg-blue-600' },
    { name: 'Comunicación y Literatura', percent: 95, color: 'bg-rose-500' },
    { name: 'Ciencia y Tecnología', percent: 82, color: 'bg-emerald-500' },
    { name: 'Inglés / Idioma Extranjero', percent: 91, color: 'bg-indigo-500' },
    { name: 'Arte y Cultura', percent: 76, color: 'bg-amber-500' }
  ];

  ngOnInit() {
    this.animateLoad();
  }

  animateLoad() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 100);
  }

  getAttendancePercentage(): number {
    if (this.attendanceStats.total === 0) return 0;
    return Math.round((this.attendanceStats.presente / this.attendanceStats.total) * 100);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días`;
    return `En ${diffDays} días`;
  }

  getSafeIcon(name: string): SafeHtml {
    const map: Record<string, string> = {
      alertCircle: ICONS.alertCircle,
      clock: ICONS.clock,
      calendar: ICONS.calendar,
      trendingUp: ICONS.trendingUp,
      bookOpen: ICONS.bookOpen,
    };
    const svg = map[name] || ICONS.activity;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
