import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AcademicYear } from '@core/models/AcademicYear';
import {
  AcademicService,
  Course,
  GradeLevel,
  Section,
} from '@core/services/academic.service';
import {
  BulkImportContextPayload,
  BulkImportResponse,
  BulkImportService,
  BulkImportType,
} from '@core/services/bulk-import.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { SettingMetricCardComponent } from '@shared/components/setting-metric-card/setting-metric-card.component';

interface ImportDefinition {
  type: BulkImportType;
  label: string;
  description: string;
  sampleFileName: string;
  notes: string[];
}

interface ImportContextForm {
  default_password: string;
  section_id: string;
  course_id: string;
  auto_enroll_by_section: boolean;
}

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, SettingMetricCardComponent],
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.css']
})
export class BulkImportComponent implements OnInit {
  private readonly bulkImportService = inject(BulkImportService);
  private readonly academicService = inject(AcademicService);

  readonly definitions: ImportDefinition[] = [
    {
      type: 'teachers',
      label: 'Docentes',
      description: 'Crea usuario, perfil y registro docente en una sola carga.',
      sampleFileName: 'docentes.csv',
      notes: [
        'Si defines una contrasena temporal general, el CSV ya no necesita password_temp.',
        'Usa un correo unico por docente.',
        'status puede ser active o inactive.',
      ],
    },
    {
      type: 'guardians',
      label: 'Apoderados',
      description: 'Crea cuentas familiares y opcionalmente las vincula al estudiante en la misma importacion.',
      sampleFileName: 'apoderados.csv',
      notes: [
        'Puedes incluir student_dni, student_code o student_email para crear el vinculo automaticamente.',
        'Si defines una contrasena temporal general, el CSV ya no necesita password_temp.',
        'is_primary y relationship_is_primary aceptan true, false, 1, 0, si o yes.',
      ],
    },
    {
      type: 'students',
      label: 'Estudiantes',
      description: 'Crea alumnos, los ubica en una seccion y puede matricularlos automaticamente en sus cursos.',
      sampleFileName: 'estudiantes.csv',
      notes: [
        'Si eliges una seccion arriba, el CSV ya no necesita academic_year, grade, level ni section_letter.',
        'Si defines una contrasena temporal general, el CSV ya no necesita password_temp.',
        'auto_enroll_by_section en true matricula al alumno en todos los cursos del grado.',
      ],
    },
    {
      type: 'student_guardians',
      label: 'Vinculos',
      description: 'Relaciona estudiantes y apoderados ya creados.',
      sampleFileName: 'vinculos-estudiante-apoderado.csv',
      notes: [
        'Debes enviar una referencia del estudiante y una del apoderado.',
        'Si el vinculo ya existe, la fila se marca como omitida.',
      ],
    },
    {
      type: 'teacher_assignments',
      label: 'Asignaciones docentes',
      description: 'Asigna docente, curso y seccion con menos columnas cuando el contexto ya esta elegido.',
      sampleFileName: 'asignaciones-docentes.csv',
      notes: [
        'Si eliges seccion y curso arriba, el CSV solo necesita la referencia del docente.',
        'El docente puede identificarse por DNI, codigo o correo.',
      ],
    },
  ];

  readonly selectedType = signal<BulkImportType>('students');
  readonly selectedFile = signal<File | null>(null);
  readonly previewResult = signal<BulkImportResponse | null>(null);
  readonly previewing = signal(false);
  readonly importing = signal(false);
  readonly loadingCatalogs = signal(false);

  readonly sections = signal<Section[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly gradeLevels = signal<GradeLevel[]>([]);
  readonly academicYears = signal<AcademicYear[]>([]);

  readonly context = signal<ImportContextForm>({
    default_password: '',
    section_id: '',
    course_id: '',
    auto_enroll_by_section: true,
  });

  readonly selectedDefinition = computed(
    () => this.definitions.find((item) => item.type === this.selectedType()) ?? this.definitions[0]
  );

  readonly selectedSection = computed(
    () => this.sections().find((section) => section.id === this.context().section_id) ?? null
  );

  readonly selectedCourse = computed(
    () => this.courses().find((course) => course.id === this.context().course_id) ?? null
  );

  readonly availableCourses = computed(() => {
    const section = this.selectedSection();
    if (!section || this.selectedType() !== 'teacher_assignments') {
      return this.courses();
    }

    return this.courses().filter((course) => course.grade_level_id === section.grade_level_id);
  });

  readonly visibleRows = computed(() => (this.previewResult()?.rows ?? []).slice(0, 120));

  readonly effectiveRequiredColumns = computed(() => this.buildRequiredColumns());
  readonly effectiveOptionalColumns = computed(() => this.buildOptionalColumns());
  readonly contextHighlights = computed(() => this.buildContextHighlights());

  ngOnInit(): void {
    this.loadCatalogs();
  }

  onTypeChange(type: BulkImportType): void {
    this.selectedType.set(type);
    this.previewResult.set(null);

    this.context.update((current) => ({
      ...current,
      section_id: ['students', 'teacher_assignments'].includes(type) ? current.section_id : '',
      course_id: type === 'teacher_assignments' ? current.course_id : '',
      auto_enroll_by_section: type === 'students' ? current.auto_enroll_by_section : true,
    }));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.previewResult.set(null);
  }

  onDefaultPasswordChange(value: string): void {
    this.context.update((current) => ({
      ...current,
      default_password: value,
    }));
    this.previewResult.set(null);
  }

  onSectionChange(sectionId: string): void {
    const selectedSection = this.sections().find((section) => section.id === sectionId) ?? null;

    this.context.update((current) => {
      const nextCourseId = selectedSection && current.course_id
        ? this.courses().some((course) => course.id === current.course_id && course.grade_level_id === selectedSection.grade_level_id)
          ? current.course_id
          : ''
        : current.course_id;

      return {
        ...current,
        section_id: sectionId,
        course_id: this.selectedType() === 'teacher_assignments' ? nextCourseId : current.course_id,
      };
    });

    this.previewResult.set(null);
  }

  onCourseChange(courseId: string): void {
    this.context.update((current) => ({
      ...current,
      course_id: courseId,
    }));
    this.previewResult.set(null);
  }

  onAutoEnrollChange(value: boolean): void {
    this.context.update((current) => ({
      ...current,
      auto_enroll_by_section: value,
    }));
    this.previewResult.set(null);
  }

  downloadTemplate(): void {
    const headers = this.buildTemplateHeaders();
    const sampleRow = headers.map((header) => this.sampleValueForHeader(header));
    const csv = [
      headers.join(','),
      sampleRow.map((value) => this.escapeCsvValue(value)).join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.selectedDefinition().sampleFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  runPreview(): void {
    const file = this.selectedFile();
    if (!file) {
      Swal.fire('Archivo requerido', 'Selecciona un CSV antes de continuar.', 'warning');
      return;
    }

    this.previewing.set(true);
    this.bulkImportService.preview(this.selectedType(), file, this.buildContextPayload()).subscribe({
      next: (response) => {
        this.previewResult.set(response);
        this.previewing.set(false);
      },
      error: (error) => {
        this.previewing.set(false);
        Swal.fire('Error', this.getErrorMessage(error, 'No se pudo previsualizar el archivo.'), 'error');
      },
    });
  }

  runImport(): void {
    const file = this.selectedFile();
    if (!file) {
      Swal.fire('Archivo requerido', 'Selecciona un CSV antes de importar.', 'warning');
      return;
    }

    this.importing.set(true);
    this.bulkImportService.import(this.selectedType(), file, this.buildContextPayload()).subscribe({
      next: (response) => {
        this.previewResult.set(response);
        this.importing.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Importacion completada',
          text: response.message || 'La carga masiva termino correctamente.',
          confirmButtonColor: '#0f766e',
        });
      },
      error: (error) => {
        this.importing.set(false);

        if (error?.status === 422 && error?.error) {
          this.previewResult.set(error.error);
        }

        Swal.fire('Error', this.getErrorMessage(error, 'No se pudo ejecutar la importacion.'), 'error');
      },
    });
  }

  canImport(): boolean {
    return !!this.selectedFile() && !this.importing() && !this.previewHasErrors();
  }

  previewHasErrors(): boolean {
    return (this.previewResult()?.summary?.error_rows ?? 0) > 0;
  }

  summaryValue(key: keyof BulkImportResponse['summary']): number {
    return this.previewResult()?.summary?.[key] ?? 0;
  }

  rowTone(action: string): string {
    switch (action) {
      case 'create':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'skip':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'create':
        return 'Crear';
      case 'skip':
        return 'Omitir';
      default:
        return 'Error';
    }
  }

  sectionLabel(section: Section): string {
    const gradeLevel = this.gradeLevels().find((item) => item.id === section.grade_level_id);
    const academicYear = this.academicYears().find((item) => item.id === section.academic_year_id);
    const gradeLabel = gradeLevel ? `${gradeLevel.grade} ${gradeLevel.level}` : 'Grado';
    const yearLabel = academicYear?.year ? String(academicYear.year) : 'Ano';
    const sectionCode = section.section_letter || section.name || 'Seccion';

    return `${yearLabel} - ${gradeLabel} - ${sectionCode}`;
  }

  courseLabel(course: Course): string {
    const gradeLevel = this.gradeLevels().find((item) => item.id === course.grade_level_id);
    const gradeLabel = gradeLevel ? ` (${gradeLevel.grade} ${gradeLevel.level})` : '';
    return `${course.code} - ${course.name}${gradeLabel}`;
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    forkJoin({
      sections: this.academicService.getSections({ per_page: 300 }),
      courses: this.academicService.getCourses({ per_page: 300 }),
      gradeLevels: this.academicService.getGradeLevels({ per_page: 150 }),
      academicYears: this.academicService.getAcademicYears({ per_page: 50 }),
    }).subscribe({
      next: (response) => {
        this.sections.set(this.normalizeCollection<Section>(response.sections));
        this.courses.set(this.normalizeCollection<Course>(response.courses));
        this.gradeLevels.set(this.normalizeCollection<GradeLevel>(response.gradeLevels));
        this.academicYears.set(this.normalizeCollection<AcademicYear>(response.academicYears));
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.loadingCatalogs.set(false);
        Swal.fire('Error', 'No se pudieron cargar las secciones, cursos o catalogos base.', 'error');
      },
    });
  }

  private buildContextPayload(): BulkImportContextPayload {
    const current = this.context();
    const payload: BulkImportContextPayload = {};

    if (current.default_password.trim()) {
      payload.default_password = current.default_password.trim();
    }

    if (this.selectedType() === 'students' && current.section_id) {
      payload.section_id = current.section_id;
      payload.auto_enroll_by_section = current.auto_enroll_by_section;
    }

    if (this.selectedType() === 'teacher_assignments') {
      if (current.section_id) {
        payload.section_id = current.section_id;
      }

      if (current.course_id) {
        payload.course_id = current.course_id;
      }
    }

    return payload;
  }

  private buildRequiredColumns(): string[] {
    const current = this.context();

    switch (this.selectedType()) {
      case 'teachers':
        return ['full_name', 'email', ...(current.default_password.trim() ? [] : ['password_temp'])];
      case 'guardians':
        return ['full_name', 'email', ...(current.default_password.trim() ? [] : ['password_temp'])];
      case 'students':
        return [
          'full_name',
          'email',
          ...(current.default_password.trim() ? [] : ['password_temp']),
          ...(current.section_id ? [] : ['academic_year', 'grade', 'level', 'section_letter']),
        ];
      case 'student_guardians':
        return ['student_dni o student_code o student_email', 'guardian_dni o guardian_email'];
      case 'teacher_assignments':
        return [
          ...(current.section_id ? [] : ['academic_year', 'grade', 'level', 'section_letter']),
          ...(current.course_id ? [] : ['course_code']),
          'teacher_dni o teacher_code o teacher_email',
        ];
      default:
        return [];
    }
  }

  private buildOptionalColumns(): string[] {
    switch (this.selectedType()) {
      case 'teachers':
        return ['dni', 'phone', 'specialization', 'hire_date', 'status'];
      case 'guardians':
        return [
          'dni',
          'phone',
          'address',
          'relationship',
          'is_primary',
          'student_dni',
          'student_code',
          'student_email',
          'relationship_is_primary',
        ];
      case 'students':
        return ['dni', 'birth_date', 'gender', 'address', 'enrollment_date', 'status', 'auto_enroll_by_section'];
      case 'student_guardians':
        return ['is_primary'];
      case 'teacher_assignments':
        return ['assigned_at', 'is_active', 'notes'];
      default:
        return [];
    }
  }

  private buildContextHighlights(): string[] {
    const current = this.context();
    const highlights: string[] = [];

    if (current.default_password.trim()) {
      highlights.push('Contrasena temporal general activa');
    }

    if (this.selectedType() === 'students' && this.selectedSection()) {
      highlights.push(`Seccion fija: ${this.sectionLabel(this.selectedSection()!)}`);
      highlights.push(
        current.auto_enroll_by_section
          ? 'Auto matricula por seccion activada'
          : 'Auto matricula por seccion desactivada'
      );
    }

    if (this.selectedType() === 'teacher_assignments' && this.selectedSection()) {
      highlights.push(`Seccion fija: ${this.sectionLabel(this.selectedSection()!)}`);
    }

    if (this.selectedType() === 'teacher_assignments' && this.selectedCourse()) {
      highlights.push(`Curso fijo: ${this.courseLabel(this.selectedCourse()!)}`);
    }

    return highlights;
  }

  private buildTemplateHeaders(): string[] {
    const current = this.context();

    switch (this.selectedType()) {
      case 'teachers':
        return [
          'full_name',
          'email',
          ...(current.default_password.trim() ? [] : ['password_temp']),
          'dni',
          'phone',
          'specialization',
          'hire_date',
          'status',
        ];
      case 'guardians':
        return [
          'full_name',
          'email',
          ...(current.default_password.trim() ? [] : ['password_temp']),
          'dni',
          'phone',
          'address',
          'relationship',
          'is_primary',
          'student_code',
          'relationship_is_primary',
        ];
      case 'students':
        return [
          'full_name',
          'email',
          ...(current.default_password.trim() ? [] : ['password_temp']),
          'dni',
          'birth_date',
          'gender',
          'address',
          ...(current.section_id ? [] : ['academic_year', 'grade', 'level', 'section_letter']),
          'enrollment_date',
          'status',
          'auto_enroll_by_section',
        ];
      case 'student_guardians':
        return ['student_code', 'guardian_dni', 'is_primary'];
      case 'teacher_assignments':
        return [
          ...(current.section_id ? [] : ['academic_year', 'grade', 'level', 'section_letter']),
          ...(current.course_id ? [] : ['course_code']),
          'teacher_dni',
          'assigned_at',
          'is_active',
          'notes',
        ];
      default:
        return [];
    }
  }

  private sampleValueForHeader(header: string): string {
    const values: Record<string, string> = {
      full_name: 'Maria Lopez',
      email: 'usuario@colegio.edu.pe',
      password_temp: 'Temp2026!',
      dni: '45678912',
      phone: '987654321',
      specialization: 'Matematica',
      hire_date: '2026-03-01',
      status: 'active',
      address: 'Jr Lima 120',
      relationship: 'Madre',
      is_primary: 'true',
      student_code: 'EST000001',
      relationship_is_primary: 'true',
      birth_date: '2012-08-11',
      gender: 'M',
      academic_year: '2026',
      grade: '1',
      level: 'Secundaria',
      section_letter: 'A',
      enrollment_date: '2026-03-10',
      auto_enroll_by_section: this.context().auto_enroll_by_section ? 'true' : 'false',
      guardian_dni: '41234567',
      course_code: 'MAT-1',
      teacher_dni: '45678912',
      assigned_at: '2026-03-05 08:00:00',
      is_active: 'true',
      notes: 'Carga inicial',
    };

    if (this.selectedType() === 'students') {
      values['full_name'] = 'Luis Perez';
      values['email'] = 'lperez@alumno.pe';
      values['dni'] = '73456789';
    }

    if (this.selectedType() === 'guardians') {
      values['full_name'] = 'Juana Quispe';
      values['email'] = 'jquispe@familia.pe';
      values['dni'] = '41234567';
    }

    if (this.selectedType() === 'teacher_assignments') {
      values['notes'] = 'Carga docente inicial';
    }

    return values[header] ?? '';
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  private normalizeCollection<T>(response: any): T[] {
    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private getErrorMessage(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      const firstMessage = validationErrors[firstKey]?.[0];
      if (firstMessage) {
        return firstMessage;
      }
    }

    return error?.error?.message || fallback;
  }
}
