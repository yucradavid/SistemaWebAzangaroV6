import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '@core/services/seo/seo.service';
import { EnrollmentService } from '@core/services/enrollment.service';

@Component({
  selector: 'app-admision',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admision.component.html',
  styleUrl: './admision.component.css'
})
export class AdmisionComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly fb = inject(FormBuilder);

  readonly openFaqIndex = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly loadError = signal('');

  admissionForm: FormGroup;
  academicYears: any[] = [];
  gradeLevels: any[] = [];

  readonly documentTypes = [
    { id: 'DNI', label: 'DNI' },
    { id: 'CE', label: 'Carnet de extranjeria' },
    { id: 'Pasaporte', label: 'Pasaporte' }
  ];

  readonly genders = [
    { id: 'M', label: 'Masculino' },
    { id: 'F', label: 'Femenino' }
  ];

  readonly relationships = [
    { id: 'Madre', label: 'Madre' },
    { id: 'Padre', label: 'Padre' },
    { id: 'Tutor', label: 'Tutor' },
    { id: 'Otro', label: 'Otro' }
  ];

  readonly admissionSteps = [
    { step: 1, title: 'Pre matricula web', description: 'Completa el formulario con los datos del estudiante y del apoderado.' },
    { step: 2, title: 'Revision administrativa', description: 'El area de admision valida la solicitud y revisa la vacante disponible.' },
    { step: 3, title: 'Aprobacion o rechazo', description: 'El admin aprueba o rechaza la pre matricula desde el panel de solicitudes.' },
    { step: 4, title: 'Matricula final', description: 'Si la solicitud es aprobada, el estudiante pasa al flujo formal de matricula.' }
  ];

  readonly faqs = [
    {
      question: 'La pre matricula garantiza la vacante?',
      answer: 'No. La solicitud entra a revision administrativa y despues el colegio aprueba o rechaza la vacante segun disponibilidad.'
    },
    {
      question: 'Que datos debo completar?',
      answer: 'Debes ingresar datos del estudiante, del apoderado, el ano academico y el grado al que postula.'
    },
    {
      question: 'Luego puedo corregir la solicitud?',
      answer: 'Si el colegio aun no la reviso, podras volver a registrar una solicitud correcta o comunicarte con admision.'
    },
    {
      question: 'Que pasa si la solicitud es aprobada?',
      answer: 'El administrador la aprueba, asigna seccion y el sistema podra continuar con el proceso academico y financiero del nuevo estudiante.'
    }
  ];

  constructor() {
    this.admissionForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      grade_level_id: ['', Validators.required],
      student_first_name: ['', Validators.required],
      student_last_name: ['', Validators.required],
      student_document_type: ['DNI', Validators.required],
      student_document_number: ['', Validators.required],
      student_birth_date: ['', Validators.required],
      student_gender: ['', Validators.required],
      student_address: [''],
      guardian_first_name: ['', Validators.required],
      guardian_last_name: ['', Validators.required],
      guardian_document_type: ['DNI', Validators.required],
      guardian_document_number: ['', Validators.required],
      guardian_phone: ['', Validators.required],
      guardian_email: ['', [Validators.required, Validators.email]],
      guardian_address: [''],
      guardian_relationship: ['Madre', Validators.required],
      previous_school: [''],
      has_special_needs: [false],
      special_needs_description: [''],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.seoService.updateTitle('Proceso de Admision 2026 - CERMAT SCHOOL');
    this.seoService.updateMetaTags({
      description: 'Completa la pre matricula del estudiante y deja la solicitud lista para aprobacion administrativa.',
      keywords: 'admision colegio, pre matricula, inscripciones, CERMAT'
    });

    this.loadAdmissionOptions();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.admissionForm.markAllAsTouched();
      return;
    }

    const hasSpecialNeeds = !!this.admissionForm.get('has_special_needs')?.value;
    if (hasSpecialNeeds && !String(this.admissionForm.get('special_needs_description')?.value || '').trim()) {
      this.admissionForm.get('special_needs_description')?.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.loadError.set('');

    const payload = {
      ...this.admissionForm.getRawValue(),
      student_first_name: String(this.admissionForm.get('student_first_name')?.value || '').trim(),
      student_last_name: String(this.admissionForm.get('student_last_name')?.value || '').trim(),
      student_document_type: String(this.admissionForm.get('student_document_type')?.value || '').trim(),
      student_document_number: String(this.admissionForm.get('student_document_number')?.value || '').trim(),
      student_gender: String(this.admissionForm.get('student_gender')?.value || '').trim(),
      student_address: String(this.admissionForm.get('student_address')?.value || '').trim() || null,
      guardian_first_name: String(this.admissionForm.get('guardian_first_name')?.value || '').trim(),
      guardian_last_name: String(this.admissionForm.get('guardian_last_name')?.value || '').trim(),
      guardian_document_type: String(this.admissionForm.get('guardian_document_type')?.value || '').trim(),
      guardian_document_number: String(this.admissionForm.get('guardian_document_number')?.value || '').trim(),
      guardian_phone: String(this.admissionForm.get('guardian_phone')?.value || '').trim(),
      guardian_email: String(this.admissionForm.get('guardian_email')?.value || '').trim(),
      guardian_address: String(this.admissionForm.get('guardian_address')?.value || '').trim() || null,
      guardian_relationship: String(this.admissionForm.get('guardian_relationship')?.value || '').trim() || null,
      previous_school: String(this.admissionForm.get('previous_school')?.value || '').trim() || null,
      special_needs_description: hasSpecialNeeds
        ? String(this.admissionForm.get('special_needs_description')?.value || '').trim()
        : null,
      emergency_contact_name: String(this.admissionForm.get('emergency_contact_name')?.value || '').trim() || null,
      emergency_contact_phone: String(this.admissionForm.get('emergency_contact_phone')?.value || '').trim() || null,
      notes: String(this.admissionForm.get('notes')?.value || '').trim() || null,
    };

    this.enrollmentService.createPublicApplication(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);

        const activeYearId = this.admissionForm.get('academic_year_id')?.value
          || this.academicYears.find((year: any) => year.is_active)?.id
          || '';

        this.admissionForm.reset({
          academic_year_id: activeYearId,
          grade_level_id: '',
          student_document_type: 'DNI',
          guardian_document_type: 'DNI',
          student_gender: '',
          guardian_relationship: 'Madre',
          has_special_needs: false
        });

        setTimeout(() => this.submitSuccess.set(false), 5000);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const firstValidationError = Object.values(error?.error?.errors || {})[0];
        const validationMessage = Array.isArray(firstValidationError) ? firstValidationError[0] : '';

        this.loadError.set(
          validationMessage
          || error?.error?.message
          || 'No se pudo registrar la pre matricula. Intenta nuevamente.'
        );
      }
    });
  }

  private loadAdmissionOptions(): void {
    this.enrollmentService.getPublicOptions().subscribe({
      next: (response) => {
        this.academicYears = Array.isArray(response?.academic_years) ? response.academic_years : [];
        this.gradeLevels = Array.isArray(response?.grade_levels) ? response.grade_levels : [];

        const activeYear = this.academicYears.find((year: any) => year.is_active);
        this.admissionForm.patchValue({
          academic_year_id: activeYear?.id || this.academicYears[0]?.id || ''
        });
      },
      error: () => {
        this.loadError.set('No se pudieron cargar las opciones de admision. Recarga la pagina.');
      }
    });
  }
}
