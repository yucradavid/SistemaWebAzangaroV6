import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AcademicService } from '@core/services/academic.service';
import { AuthService } from '@core/services/auth.service';
import { MessagingService } from '@core/services/messaging.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

interface TutoriaStudentCard {
  studentId: string;
  fullName: string;
  studentCode: string;
  sectionLabel: string;
  gradeLevelId: string;
  level: string;
  guardianName: string;
  guardianPhone: string;
}

interface CascadeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-tutoria-academica',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  templateUrl: './tutoria-academica.component.html'
})
export class TutoriaAcademicaComponent implements OnInit {
  private readonly academicService = inject(AcademicService);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);

  role: string | null = null;

  searchTerm = '';
  selectedLevel = '';
  selectedGradeLevelId = '';
  selectedSectionId = '';

  levelOptions: CascadeOption[] = [];
  gradeOptions: Array<CascadeOption & { level: string }> = [];
  sectionOptions: Array<CascadeOption & { gradeLevelId: string }> = [];

  results: TutoriaStudentCard[] = [];
  loadingOptions = false;
  loadingResults = false;
  searched = false;

  selectedStudent: TutoriaStudentCard | null = null;
  messageTitle = '';
  messageBody = '';
  sendWhatsapp = true;
  sending = false;

  ngOnInit(): void {
    this.role = this.authService.currentUser()?.role ?? null;
    this.loadCascadeOptions();
    this.search();
  }

  get filteredGradeOptions(): Array<CascadeOption & { level: string }> {
    if (!this.selectedLevel) {
      return this.gradeOptions;
    }

    return this.gradeOptions.filter((grade) => grade.level === this.selectedLevel);
  }

  get filteredSectionOptions(): Array<CascadeOption & { gradeLevelId: string }> {
    if (!this.selectedGradeLevelId) {
      return [];
    }

    return this.sectionOptions.filter((section) => section.gradeLevelId === this.selectedGradeLevelId);
  }

  get canSubmit(): boolean {
    return !!this.selectedStudent && !!this.messageTitle.trim() && !!this.messageBody.trim() && !this.sending;
  }

  onLevelChange(): void {
    this.selectedGradeLevelId = '';
    this.selectedSectionId = '';
    this.search();
  }

  onGradeChange(): void {
    this.selectedSectionId = '';
    this.search();
  }

  onSectionChange(): void {
    this.search();
  }

  onSearchTermChange(): void {
    this.search();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = '';
    this.selectedGradeLevelId = '';
    this.selectedSectionId = '';
    this.search();
  }

  search(): void {
    this.searched = true;
    this.loadingResults = true;

    const params: Record<string, string | number> = { status: 'active', per_page: 100 };
    if (this.searchTerm.trim()) {
      params['q'] = this.searchTerm.trim();
    }
    if (this.selectedLevel) {
      params['level'] = this.selectedLevel;
    }
    if (this.selectedGradeLevelId) {
      params['grade_level_id'] = this.selectedGradeLevelId;
    }
    if (this.selectedSectionId) {
      params['section_id'] = this.selectedSectionId;
    }

    this.academicService.getStudentCourseEnrollments(params).subscribe({
      next: (response) => {
        const rows = this.extractRows<any>(response);
        const map = new Map<string, TutoriaStudentCard>();

        rows.forEach((enrollment) => {
          const student = enrollment.student;
          if (!student?.id || map.has(student.id)) {
            return;
          }

          const section = enrollment.section;
          const gradeLevel = section?.grade_level || section?.gradeLevel;
          const guardians = student.guardians || [];
          const primaryGuardian = guardians.find((guardian: any) => guardian.is_primary) || guardians[0];

          map.set(student.id, {
            studentId: student.id,
            fullName: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            studentCode: student.student_code || '',
            sectionLabel: this.buildSectionLabel(gradeLevel, section),
            gradeLevelId: section?.grade_level_id || gradeLevel?.id || '',
            level: gradeLevel?.level || '',
            guardianName: primaryGuardian
              ? `${primaryGuardian.first_name || ''} ${primaryGuardian.last_name || ''}`.trim()
              : '',
            guardianPhone: primaryGuardian?.phone || ''
          });
        });

        this.results = Array.from(map.values()).sort((left, right) => left.fullName.localeCompare(right.fullName));
        this.loadingResults = false;
      },
      error: () => {
        this.results = [];
        this.loadingResults = false;
      }
    });
  }

  getInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  selectStudent(card: TutoriaStudentCard): void {
    this.selectedStudent = card;
    this.messageTitle = '';
    this.messageBody = '';
    this.sendWhatsapp = !!card.guardianPhone;
  }

  closeForm(): void {
    this.selectedStudent = null;
    this.messageTitle = '';
    this.messageBody = '';
  }

  submit(): void {
    if (!this.canSubmit || !this.selectedStudent) {
      return;
    }

    this.sending = true;
    const student = this.selectedStudent;
    const content = this.messageBody.trim();

    const title = this.messageTitle.trim();

    this.messagingService.sendMessage({
      student_id: student.studentId,
      content,
      category: 'tutoria',
      title
    }).subscribe({
      next: () => {
        this.sending = false;

        Swal.fire({
          icon: 'success',
          title: 'Tutoría registrada',
          text: `Se notificó a ${student.fullName} y a su apoderado.`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });

        if (this.sendWhatsapp && student.guardianPhone) {
          this.shareViaWhatsapp(student, title, content);
        }

        this.closeForm();
        this.search();
      },
      error: (error) => {
        this.sending = false;
        Swal.fire('Error', error?.error?.message || 'No se pudo registrar el mensaje de tutoría.', 'error');
      }
    });
  }

  // Envio 100% manual: solo abre wa.me con el mensaje pre-armado, quien lo
  // registra revisa y presiona enviar. Mismo patron ya usado en Admision
  // (enrollment-approvals.component.ts::shareCredentialsViaWhatsapp).
  private shareViaWhatsapp(student: TutoriaStudentCard, title: string, content: string): void {
    const rawPhone = String(student.guardianPhone || '').replace(/\D/g, '');
    if (!rawPhone) {
      return;
    }

    const fullPhone = rawPhone.startsWith('51') ? rawPhone : '51' + rawPhone;

    const lines = [
      `Hola ${student.guardianName || 'apoderado(a)'},`,
      '',
      `El colegio registró un mensaje de tutoría académica sobre ${student.fullName}:`,
      '',
      `*${title}*`,
      content,
      '',
      'Puedes ver el detalle completo ingresando al sistema del colegio.'
    ];

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  }

  private buildSectionLabel(gradeLevel: any, section: any): string {
    const gradeName = gradeLevel?.name || '';
    const sectionLetter = section?.section_letter || '';

    if (!gradeName && !sectionLetter) {
      return 'Sin sección';
    }
    if (!gradeName) {
      return `Sección ${sectionLetter}`;
    }
    if (!sectionLetter) {
      return gradeName;
    }

    return `${gradeName} - Sección ${sectionLetter}`;
  }

  private loadCascadeOptions(): void {
    this.loadingOptions = true;

    if (this.role === 'teacher') {
      this.academicService.getTeacherCourseAssignments({ is_active: true, per_page: 200 }).subscribe({
        next: (response) => {
          const assignments = this.extractRows<any>(response);
          this.buildCascadeFromSections(assignments.map((assignment) => assignment.section).filter(Boolean));
          this.loadingOptions = false;
        },
        error: () => {
          this.loadingOptions = false;
        }
      });
      return;
    }

    this.academicService.getSections({ per_page: 300 }).subscribe({
      next: (response) => {
        const sections = this.extractRows<any>(response);
        this.buildCascadeFromSections(sections);
        this.loadingOptions = false;
      },
      error: () => {
        this.loadingOptions = false;
      }
    });
  }

  private buildCascadeFromSections(sections: any[]): void {
    const levelMap = new Map<string, string>();
    const gradeMap = new Map<string, { label: string; level: string }>();
    const sectionMap = new Map<string, { label: string; gradeLevelId: string }>();

    sections.forEach((section) => {
      const gradeLevel = section?.grade_level || section?.gradeLevel;
      if (!gradeLevel) {
        return;
      }

      const level = gradeLevel.level || '';
      if (level && !levelMap.has(level)) {
        levelMap.set(level, this.getLevelLabel(level));
      }

      if (gradeLevel.id && !gradeMap.has(gradeLevel.id)) {
        gradeMap.set(gradeLevel.id, { label: gradeLevel.name || 'Grado', level });
      }

      if (section.id && !sectionMap.has(section.id)) {
        sectionMap.set(section.id, {
          label: `${gradeLevel.name || ''} - ${section.section_letter || ''}`.trim(),
          gradeLevelId: gradeLevel.id || ''
        });
      }
    });

    this.levelOptions = Array.from(levelMap.entries()).map(([value, label]) => ({ value, label }));
    this.gradeOptions = Array.from(gradeMap.entries()).map(([value, item]) => ({
      value,
      label: item.label,
      level: item.level
    }));
    this.sectionOptions = Array.from(sectionMap.entries()).map(([value, item]) => ({
      value,
      label: item.label,
      gradeLevelId: item.gradeLevelId
    }));
  }

  private getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      inicial: 'Inicial',
      primaria: 'Primaria',
      secundaria: 'Secundaria'
    };

    return labels[level] || level;
  }

  private extractRows<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data || [];
  }
}
