import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-teacher-attendance-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, BackButtonComponent],
  templateUrl: './teacher-attendance-menu.component.html',
  styles: [`
    :host { display: block; background: #F8FAFC; min-height: 100vh; }
  `]
})
export class TeacherAttendanceMenuComponent {
  private router = inject(Router);

  goToStudentAttendance(): void {
    this.router.navigate(['/app/attendance/teacher']);
  }

  goToMyAttendance(): void {
    this.router.navigate(['/app/attendance/teacher/my']);
  }
}
