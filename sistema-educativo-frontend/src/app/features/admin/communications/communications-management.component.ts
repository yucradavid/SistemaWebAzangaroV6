import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { MessagingService, Announcement } from '@core/services/messaging.service';
import { AcademicService } from '@core/services/academic.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-communications-management',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './communications-management.component.html',
  styleUrls: ['./communications-management.component.css']
})
export class CommunicationsManagementComponent implements OnInit {
  kpis = [
    { label: 'Total', value: 0, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4"/><path d="M10 17h4"/>' },
    { label: 'Publicados', value: 0, iconColor: 'text-green-500', bgColor: 'bg-green-50', icon: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { label: 'Borradores', value: 0, iconColor: 'text-orange-500', bgColor: 'bg-orange-50', icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
    { label: 'Pendientes', value: 0, iconColor: 'text-purple-500', bgColor: 'bg-purple-50', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  ];

  communications: Announcement[] = [];
  filteredCommunications: Announcement[] = [];
  sections: any[] = [];
  loading = false;
  saving = false;

  filters = { status: '', audience: '' };

  showModal = false;
  isEditing = false;
  currentId: string | null = null;
  form: FormGroup;

  constructor(
    private messagingService: MessagingService,
    private academicService: AcademicService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      audience: ['todos', Validators.required],
      section_id: ['']
    });

    this.form.get('audience')?.valueChanges.subscribe(value => {
      const sectionControl = this.form.get('section_id');

      if (value === 'seccion_especifica') {
        sectionControl?.setValidators(Validators.required);
      } else {
        sectionControl?.clearValidators();
        sectionControl?.setValue('');
      }

      sectionControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadAnnouncements();
    this.loadSections();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.messagingService.getAnnouncements(this.filters).subscribe({
      next: (response) => {
        this.communications = response.data || [];
        this.filteredCommunications = [...this.communications];
        this.updateKPIs();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadSections(): void {
    this.academicService.getSections({ per_page: 200 }).subscribe(response => {
      this.sections = response.data || response;
    });
  }

  applyFilters(key: 'status' | 'audience', value: string): void {
    this.filters[key] = value;
    this.loadAnnouncements();
  }

  updateKPIs(): void {
    this.kpis[0].value = this.communications.length;
    this.kpis[1].value = this.communications.filter(comm => comm.status === 'publicado').length;
    this.kpis[2].value = this.communications.filter(comm => comm.status === 'borrador').length;
    this.kpis[3].value = this.communications.filter(comm => comm.status === 'pendiente_aprobacion').length;
  }

  getAudienceLabel(comm: Announcement): string {
    if (comm.audience === 'seccion_especifica') {
      return `Sección: ${this.getSectionLabel(comm.section)}`;
    }

    const labels: Record<string, string> = {
      todos: 'Todos',
      docentes: 'Docentes',
      estudiantes: 'Estudiantes',
      apoderados: 'Apoderados'
    };

    return labels[comm.audience] || comm.audience;
  }

  getSectionLabel(section: any): string {
    if (!section) {
      return 'Sin sección';
    }

    const gradeName = section.grade_level?.name || section.gradeLevel?.name || '';
    const sectionName = section.name || section.section_letter || '';

    if (!gradeName && !sectionName) {
      return 'Sección';
    }

    if (!gradeName) {
      return `Sección ${sectionName}`;
    }

    if (!sectionName) {
      return gradeName;
    }

    return `${gradeName} - Sección ${sectionName}`;
  }

  getCreatorLabel(comm: Announcement): string {
    return comm.creator?.full_name || 'Creado por administración';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      borrador: 'bg-orange-50 text-orange-600',
      pendiente_aprobacion: 'bg-purple-50 text-purple-600',
      publicado: 'bg-green-50 text-green-600',
      archivado: 'bg-slate-100 text-slate-500'
    };

    return map[status] || 'bg-slate-100 text-slate-500';
  }

  openModal(): void {
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({ audience: 'todos' });
    this.showModal = true;
  }

  editAnnouncement(comm: Announcement): void {
    this.isEditing = true;
    this.currentId = comm.id;
    this.form.patchValue({
      title: comm.title,
      content: comm.content,
      audience: comm.audience,
      section_id: comm.section_id || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveAnnouncement(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving = true;

    const request = this.isEditing && this.currentId
      ? this.messagingService.updateAnnouncement(this.currentId, this.form.value)
      : this.messagingService.createAnnouncement(this.form.value);

    request.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? 'Actualizado' : 'Borrador Creado',
          text: 'El comunicado se ha guardado exitosamente.',
          confirmButtonColor: '#1e3a8a',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadAnnouncements();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        Swal.fire('Error', 'No se pudo guardar el comunicado.', 'error');
      }
    });
  }

  requestApproval(id: string): void {
    Swal.fire({
      title: '¿Solicitar Aprobación?',
      text: 'El comunicado pasará a revisión por un administrador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.messagingService.requestApproval(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Enviado',
              text: 'Se ha solicitado aprobación.',
              toast: true,
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false
            });
            this.loadAnnouncements();
          }
        });
      }
    });
  }

  archive(id: string): void {
    this.messagingService.archiveAnnouncement(id).subscribe({
      next: () => this.loadAnnouncements()
    });
  }

  deleteAnnouncement(id: string): void {
    Swal.fire({
      title: '¿Eliminar Comunicado?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.messagingService.deleteAnnouncement(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              toast: true,
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false
            });
            this.loadAnnouncements();
          }
        });
      }
    });
  }
}
