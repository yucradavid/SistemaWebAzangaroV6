import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '@core/services/seo/seo.service';
import { EnrollmentService, EnrollmentSibling } from '@core/services/enrollment.service';
import { PageCoverComponent } from '@shared/components/page-cover/page-cover.component';

@Component({
  selector: 'app-admision',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageCoverComponent],
  templateUrl: './admision.component.html',
  styleUrls: ['./admision.component.css']
})
export class AdmisionComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly fb = inject(FormBuilder);

  readonly openFaqIndex = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly showModal = signal(false);
  readonly isAdmissionFormOpen = signal(false);
  readonly currentStep = signal(1);
  readonly furthestStepReached = signal(1);
  readonly stepAttempted = signal<number | null>(null);
  readonly modalType = signal<'success' | 'error' | 'validation'>('success');
  readonly modalHeading = signal('');
  readonly modalDescription = signal('');
  readonly modalDetails = signal<string[]>([]);
  readonly modalPrimaryButtonLabel = signal('Aceptar');
  readonly loadError = signal('');

  readonly totalSteps = 3;

  guardianLookupLoading = false;
  guardianFound = false;
  studentLookupLoading = false;
  studentFound = false;
  siblingsDetected: EnrollmentSibling[] = [];

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

  /** Labels used to build the "missing fields" summaries (global and per-step). */
  readonly fieldLabels: { [key: string]: string } = {
    academic_year_id: 'Año académico',
    grade_level_id: 'Grado a postular',
    student_first_name: 'Nombres del estudiante',
    student_last_name: 'Apellidos del estudiante',
    student_document_type: 'Tipo de documento (Estudiante)',
    student_document_number: 'Número de documento (Estudiante)',
    student_birth_date: 'Fecha de nacimiento',
    student_gender: 'Género',
    guardian_first_name: 'Nombres del apoderado',
    guardian_last_name: 'Apellidos del apoderado',
    guardian_document_type: 'Tipo de documento (Apoderado)',
    guardian_document_number: 'Número de documento (Apoderado)',
    guardian_phone: 'Teléfono del apoderado',
    guardian_email: 'Correo del apoderado',
    guardian_relationship: 'Parentesco'
  };

  /** Which fields belong to each step, so we can validate one step at a time. */
  private readonly stepFields: { [step: number]: string[] } = {
    1: ['academic_year_id', 'grade_level_id', 'student_first_name', 'student_last_name', 'student_document_type', 'student_document_number', 'student_birth_date', 'student_gender'],
    2: ['guardian_first_name', 'guardian_last_name', 'guardian_document_type', 'guardian_document_number', 'guardian_phone', 'guardian_email', 'guardian_relationship'],
    3: []
  };

  constructor() {
    this.admissionForm = this.fb.group({
      academic_year_id: ['', Validators.required],
      grade_level_id: ['', Validators.required],
      student_first_name: ['', Validators.required],
      student_last_name: ['', Validators.required],
      student_document_type: ['DNI', Validators.required],
      student_document_number: ['', [Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]],
      student_birth_date: ['', Validators.required],
      student_gender: ['', Validators.required],
      student_address: [''],
      guardian_first_name: ['', Validators.required],
      guardian_last_name: ['', Validators.required],
      guardian_document_type: ['DNI', Validators.required],
      guardian_document_number: ['', [Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]],
      guardian_phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$'), Validators.minLength(9), Validators.maxLength(9)]],
      guardian_email: ['', [Validators.required, Validators.email]],
      guardian_address: [''],
      guardian_relationship: ['Madre', Validators.required],
      previous_school: [''],
      has_special_needs: [false],
      special_needs_description: [''],
      emergency_contact_name: [''],
      emergency_contact_phone: ['', [Validators.pattern('^[0-9]{9}$'), Validators.minLength(9), Validators.maxLength(9)]],
      notes: ['']
    });

    // Escuchar cambios de tipo de documento para ajustar validación de DNI
    this.admissionForm.get('student_document_type')?.valueChanges.subscribe(type => {
      const control = this.admissionForm.get('student_document_number');
      if (type === 'DNI') {
        control?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]);
      } else {
        control?.setValidators([Validators.required]);
      }
      control?.updateValueAndValidity();
    });

    this.admissionForm.get('guardian_document_type')?.valueChanges.subscribe(type => {
      const control = this.admissionForm.get('guardian_document_number');
      if (type === 'DNI') {
        control?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]);
      } else {
        control?.setValidators([Validators.required]);
      }
      control?.updateValueAndValidity();
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

  isFieldInvalid(fieldName: string): boolean {
    const control = this.admissionForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  /** All invalid, labeled fields across the whole form (used in the final review). */
  getMissingFields(): string[] {
    const missing: string[] = [];
    Object.keys(this.fieldLabels).forEach(key => {
      const control = this.admissionForm.get(key);
      if (control && control.invalid) {
        missing.push(this.fieldLabels[key]);
      }
    });

    const hasSpecialNeeds = this.admissionForm.get('has_special_needs')?.value;
    if (hasSpecialNeeds) {
      const desc = this.admissionForm.get('special_needs_description');
      if (!desc?.value || !String(desc.value).trim()) {
        missing.push('Descripción de necesidades especiales');
      }
    }

    return missing;
  }

  /** Invalid, labeled fields that belong only to the given step. */
  getMissingFieldsForStep(step: number): string[] {
    const fields = this.stepFields[step] || [];
    return fields
      .filter(key => this.admissionForm.get(key)?.invalid)
      .map(key => this.fieldLabels[key])
      .filter(Boolean);
  }

  private isStepValid(step: number): boolean {
    const fields = this.stepFields[step] || [];
    return fields.every(key => this.admissionForm.get(key)?.valid);
  }

  private markStepAsTouched(step: number): void {
    const fields = this.stepFields[step] || [];
    fields.forEach(key => this.admissionForm.get(key)?.markAsTouched());
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  resetSuccess(): void {
    this.submitSuccess.set(false);
    this.guardianFound = false;
    this.siblingsDetected = [];
  }

  closeModal(): void {
    this.showModal.set(false);
    this.submitSuccess.set(false);
  }

  openAdmissionForm(): void {
    this.isAdmissionFormOpen.set(true);
    this.currentStep.set(1);
    this.furthestStepReached.set(1);
    this.stepAttempted.set(null);
  }

  closeAdmissionForm(): void {
    this.isAdmissionFormOpen.set(false);
    this.currentStep.set(1);
    this.stepAttempted.set(null);
  }

  /** Steps can only be revisited once they were reached; jumping ahead requires "Siguiente". */
  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) {
      return;
    }
    if (step > this.furthestStepReached()) {
      return;
    }
    this.currentStep.set(step);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (!this.isStepValid(step)) {
      this.markStepAsTouched(step);
      this.stepAttempted.set(step);
      return;
    }

    this.stepAttempted.set(null);
    if (step < this.totalSteps) {
      const next = step + 1;
      this.currentStep.set(next);
      if (next > this.furthestStepReached()) {
        this.furthestStepReached.set(next);
      }
    }
  }

  previousStep(): void {
    this.stepAttempted.set(null);
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onStudentDniBlur(dni: string): void {
    const cleanDni = String(dni || '').trim();
    const type = this.admissionForm.get('student_document_type')?.value;

    if (type !== 'DNI' || !/^[0-9]{8}$/.test(cleanDni)) {
      return;
    }

    this.studentLookupLoading = true;
    this.studentFound = false;

    this.enrollmentService.reniecLookup(cleanDni).subscribe({
      next: (res) => {
        this.studentLookupLoading = false;

        if (!res?.success || !res.data) {
          return;
        }

        const data = res.data;
        const nombres = String(data.nombres || '').trim();
        const apellidoPaterno = String(data.apellido_paterno || '').trim();
        const apellidoMaterno = String(data.apellido_materno || '').trim();
        const apellidoCompleto = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
        const fechaNacimiento = String(data.fecha_nacimiento || '').trim();
        const sexo = String(data.sexo || '').trim().toUpperCase();

        this.studentFound = true;

        this.admissionForm.patchValue({
          student_first_name: nombres,
          student_last_name: apellidoCompleto,
          student_birth_date: fechaNacimiento,
          student_gender: sexo === 'M' || sexo === 'F' ? sexo : ''
        });
      },
      error: () => {
        this.studentLookupLoading = false;
      }
    });
  }

  onGuardianDniBlur(dni: string): void {
    const cleanDni = String(dni || '').trim();
    const type = this.admissionForm.get('guardian_document_type')?.value;

    if (type !== 'DNI' || !/^[0-9]{8}$/.test(cleanDni)) {
      return;
    }

    this.guardianLookupLoading = true;
    this.guardianFound = false;
    this.siblingsDetected = [];

    this.enrollmentService.reniecLookup(cleanDni).subscribe({
      next: (res) => {
        this.guardianLookupLoading = false;

        if (res?.success && res.data) {
          const data = res.data;
          const nombres = String(data.nombres || '').trim();
          const apellidoPaterno = String(data.apellido_paterno || '').trim();
          const apellidoMaterno = String(data.apellido_materno || '').trim();
          const apellidoCompleto = [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');

          this.guardianFound = true;
          this.admissionForm.patchValue({
            guardian_first_name: nombres,
            guardian_last_name: apellidoCompleto,
          });
          return;
        }

        this.lookupGuardianFromDatabase(cleanDni);
      },
      error: () => {
        this.guardianLookupLoading = false;
        this.lookupGuardianFromDatabase(cleanDni);
      }
    });
  }

  private lookupGuardianFromDatabase(dni: string): void {
    this.enrollmentService.guardianLookup(dni).subscribe({
      next: (res) => {
        this.guardianLookupLoading = false;

        if (!res?.found) {
          return;
        }

        this.guardianFound = true;

        this.admissionForm.patchValue({
          guardian_first_name: res.first_name ?? '',
          guardian_last_name: res.last_name ?? '',
          guardian_phone: res.phone ?? '',
          guardian_email: res.email ?? '',
          guardian_address: res.address ?? '',
          guardian_relationship: res.relationship ?? 'Madre',
        });

        if ((res.siblings_count ?? 0) > 0) {
          this.siblingsDetected = res.siblings ?? [];
        }
      },
      error: () => {
        this.guardianLookupLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.admissionForm.markAllAsTouched();

      // Jump the person back to the first step that still has an error.
      for (let step = 1; step <= this.totalSteps; step++) {
        if (!this.isStepValid(step)) {
          this.currentStep.set(step);
          this.furthestStepReached.set(Math.max(this.furthestStepReached(), step));
          this.stepAttempted.set(step);
          break;
        }
      }

      const missingFields = this.getMissingFields();
      this.modalType.set('validation');
      this.modalHeading.set('Faltan datos obligatorios');
      this.modalDescription.set('Completa los campos resaltados en el formulario antes de enviar la pre matrícula.');
      this.modalDetails.set(missingFields.length ? missingFields : ['Revisa el formulario e inténtalo de nuevo.']);
      this.modalPrimaryButtonLabel.set('Cerrar');
      this.showModal.set(true);
      return;
    }

    const hasSpecialNeeds = !!this.admissionForm.get('has_special_needs')?.value;
    if (hasSpecialNeeds && !String(this.admissionForm.get('special_needs_description')?.value || '').trim()) {
      this.admissionForm.get('special_needs_description')?.markAsTouched();
      this.currentStep.set(3);
      this.furthestStepReached.set(Math.max(this.furthestStepReached(), 3));

      this.modalType.set('validation');
      this.modalHeading.set('Falta la descripción de necesidades especiales');
      this.modalDescription.set('Si el estudiante tiene necesidades especiales, describe brevemente los requerimientos.');
      this.modalDetails.set(['Descripción de necesidades especiales']);
      this.modalPrimaryButtonLabel.set('Cerrar');
      this.showModal.set(true);
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
        this.isAdmissionFormOpen.set(false);
        this.modalType.set('success');
        this.modalHeading.set('¡Pre-Matrícula enviada con éxito!');
        this.modalDescription.set('Tu solicitud ha sido enviada al área de administración para su revisión.');
        this.modalDetails.set([
          'Te contactaremos por el correo o teléfono registrado.',
          'Podrás enviar otra solicitud si lo deseas.',
          'La administración validará la vacante y te dará respuesta pronto.'
        ]);
        this.modalPrimaryButtonLabel.set('Cerrar');
        this.showModal.set(true);

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
        this.currentStep.set(1);
        this.furthestStepReached.set(1);
        this.stepAttempted.set(null);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const firstValidationError = Object.values(error?.error?.errors || {})[0];
        const validationMessage = Array.isArray(firstValidationError) ? firstValidationError[0] : '';
        const message = validationMessage
          || error?.error?.message
          || 'No se pudo registrar la pre matrícula. Intenta nuevamente.';

        this.modalType.set('error');
        this.modalHeading.set('Error al enviar la pre matrícula');
        this.modalDescription.set(message);
        this.modalDetails.set([]);
        this.modalPrimaryButtonLabel.set('Cerrar');
        this.showModal.set(true);
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