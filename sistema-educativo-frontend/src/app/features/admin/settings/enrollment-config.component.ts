import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';
import { AcademicService, StudentCourseEnrollment } from '@core/services/academic.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-enrollment-config',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, SettingMetricCardComponent],
  templateUrl: './enrollment-config.component.html',
  styleUrls: ['./enrollment-config.component.css']
})
export class EnrollmentConfigComponent implements OnInit {
  enrollments: StudentCourseEnrollment[] = [];
  filteredEnrollments: StudentCourseEnrollment[] = [];
  
  loading = false;
  searchTerm = '';
  statusFilter = '';

  get totalEnrollments() { return this.enrollments.length; }
  get activeEnrollments() { return this.enrollments.filter(e => e.status === 'active').length; }
  get inactiveEnrollments() { return this.enrollments.filter(e => e.status !== 'active').length; }

  constructor(private academicService: AcademicService) {}

  ngOnInit() {
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.loading = true;
    this.academicService.getStudentCourseEnrollments({ per_page: 100 }).subscribe({
      next: (res: any) => {
        this.enrollments = res.data || res;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las matrículas', 'error');
      }
    });
  }

  applyFilters() {
    this.filteredEnrollments = this.enrollments.filter(enrollment => {
      const matchSearch = this.searchTerm === '' || 
                          (enrollment.user_id?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) || 
                          (enrollment.course_id?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());
      
      const matchStatus = this.statusFilter === '' || 
                          enrollment.status === this.statusFilter;

      return matchSearch && matchStatus;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getStatusClass(status: string) {
    const statuses: any = {
      'active': 'bg-green-50 text-green-600 border-green-100',
      'withdrawn': 'bg-red-50 text-red-600 border-red-100',
    };
    return statuses[status] || 'bg-slate-50 text-slate-600 border-slate-100';
  }
}
