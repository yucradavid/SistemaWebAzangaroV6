//src/app/features/admin/settings/academic-structure/academic-structure.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { AcademicYear } from '@core/models/AcademicYear';
import { AcademicService, GradeLevel, Section } from '@core/services/academic.service';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

interface GradeWithSections {
  grade: GradeLevel;
  sections: Section[];
}

interface LevelGroup {
  levelName: string;
  expanded: boolean;
  grades: GradeWithSections[];
}

interface LevelMeta {
  label: string;
  accent: string;
  badge: string;
  chip: string;
}

@Component({
  selector: 'app-academic-structure',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BackButtonComponent],
  templateUrl: './academic-structure.component.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    ::ng-deep .ios-swal-popup {
      border-radius: 20px !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08) !important;
      border: 1px solid rgba(255, 255, 255, 0.8) !important;
      padding: 2rem !important;
      backdrop-filter: blur(20px) !important;
      background: rgba(255, 255, 255, 0.95) !important;
    }
    ::ng-deep .ios-swal-title {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif !important;
      font-weight: 700 !important;
      font-size: 1.25rem !important;
      color: #1e293b !important;
      letter-spacing: -0.01em !important;
      margin-bottom: 0.5rem !important;
    }
    ::ng-deep .ios-swal-html {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif !important;
      font-size: 0.875rem !important;
      color: #64748b !important;
      line-height: 1.6 !important;
    }
    ::ng-deep .ios-swal-confirm {
      border-radius: 12px !important;
      padding: 0.65rem 1.5rem !important;
      font-weight: 600 !important;
      font-size: 0.8125rem !important;
      letter-spacing: 0.01em !important;
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%) !important;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35) !important;
      transition: all 0.2s ease !important;
      border: none !important;
    }
    ::ng-deep .ios-swal-confirm:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 20px rgba(29, 78, 216, 0.45) !important;
    }
    ::ng-deep .ios-swal-confirm:active {
      transform: translateY(0) scale(0.98) !important;
      box-shadow: 0 2px 8px rgba(29, 78, 216, 0.3) !important;
    }
    ::ng-deep .ios-swal-cancel {
      border-radius: 12px !important;
      padding: 0.65rem 1.5rem !important;
      font-weight: 600 !important;
      font-size: 0.8125rem !important;
      background: #f1f5f9 !important;
      color: #475569 !important;
      border: 1px solid #e2e8f0 !important;
      transition: all 0.2s ease !important;
    }
    ::ng-deep .ios-swal-cancel:hover {
      background: #e2e8f0 !important;
      transform: translateY(-1px) !important;
    }
    ::ng-deep .ios-swal-cancel:active {
      transform: translateY(0) scale(0.98) !important;
    }
    ::ng-deep .ios-swal-deny {
      border-radius: 12px !important;
      padding: 0.65rem 1.5rem !important;
      font-weight: 600 !important;
      font-size: 0.8125rem !important;
      background: linear-gradient(180deg, #10b981 0%, #059669 100%) !important;
      color: white !important;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35) !important;
      transition: all 0.2s ease !important;
      border: none !important;
    }
    ::ng-deep .ios-swal-deny:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 20px rgba(5, 150, 105, 0.45) !important;
    }
    ::ng-deep .ios-swal-deny:active {
      transform: translateY(0) scale(0.98) !important;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3) !important;
    }
  `]
})
export class AcademicStructureComponent implements OnInit {
  levelGroups: LevelGroup[] = [];
  academicYears: AcademicYear[] = [];
  selectedYearId = '';
  loading = false;
  sectionsLoading = false;
  generatingMissingGrades: Record<string, boolean> = {};
  generatingAllLevels = false;

  // Modal de nivel
  showLevelModal = false;
  levelSubmitting = false;
  levelForm: FormGroup;

  // Modal de grado
  showGradeModal = false;
  isEditingGrade = false;
  gradeSubmitting = false;
  currentGradeEditId: string | null = null;
  gradeServerError: string | null = null;
  gradeForm: FormGroup;

  // Modal de sección
  showSectionModal = false;
  isEditingSection = false;
  sectionSubmitting = false;
  currentSectionEditId: string | null = null;
  sectionForm: FormGroup;

  private grades: GradeLevel[] = [];
  private sections: Section[] = [];
  private expandedLevels: Record<string, boolean> = {};

  // Colores por nivel: Inicial → amber, Primaria → emerald, Secundaria → cermat-blue
  private readonly levelMeta: Record<string, LevelMeta> = {
    inicial: {
      label: 'Inicial',
      accent: 'border-amber-500',
      badge: 'bg-gradient-to-br from-amber-500 to-orange-500',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    primaria: {
      label: 'Primaria',
      accent: 'border-emerald-600',
      badge: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    secundaria: {
      label: 'Secundaria',
      accent: 'border-cermat-blue-700',
      badge: 'bg-gradient-to-br from-cermat-blue-900 to-cermat-blue-700',
      chip: 'bg-cermat-blue-50 text-cermat-blue-800 border-cermat-blue-200',
    },
  };

  private readonly levelOrder: Record<string, number> = { inicial: 1, primaria: 2, secundaria: 3 };

  // Límite máximo de grados por nivel
  private readonly maxGradesByLevel: Record<string, number> = {
    inicial: 3,
    primaria: 6,
    secundaria: 5,
  };

  // Nombre estandar del primer grado de cada nivel, usado por "Nuevo Nivel"
  // para crear el primer grado de un nivel que todavia no existe.
  private readonly firstGradeNameByLevel: Record<string, string> = {
    inicial: '3 años',
    primaria: '1er Grado de Primaria',
    secundaria: '1er Grado de Secundaria',
  };

  // Estilos iOS para SweetAlert2
  private readonly iosSwalStyles = {
    customClass: {
      popup: 'ios-swal-popup',
      title: 'ios-swal-title',
      htmlContainer: 'ios-swal-html',
      confirmButton: 'ios-swal-confirm',
      cancelButton: 'ios-swal-cancel',
      denyButton: 'ios-swal-deny',
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp',
    },
  };

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService
  ) {
    this.levelForm = this.fb.group({
      level: ['', Validators.required],
    });

    this.gradeForm = this.fb.group({
      level: ['primaria', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      grade: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    });

    this.sectionForm = this.fb.group({
      grade_level_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(5)]],
      capacity: [30, [Validators.required, Validators.min(1), Validators.max(80)]],
    });
  }

  get selectedYear(): AcademicYear | undefined {
    return this.academicYears.find((year) => year.id === this.selectedYearId);
  }

  get selectedYearLabel(): string {
    return this.selectedYear ? String(this.selectedYear.year) : 'Sin año';
  }

  get gradeOptions(): GradeLevel[] {
    return this.grades;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      years: this.academicService.getAcademicYears({ per_page: 100, simple: true }),
      grades: this.academicService.getGradeLevels({ per_page: 100, simple: true }),
    }).subscribe({
      next: ({ years, grades }) => {
        this.academicYears = this.extractCollection<AcademicYear>(years)
          .sort((left, right) => Number(right.year) - Number(left.year));
        this.grades = this.extractCollection<GradeLevel>(grades);

        if (!this.selectedYearId) {
          const activeYear = this.academicYears.find((year) => year.is_active);
          this.selectedYearId = activeYear?.id || this.academicYears[0]?.id || '';
        }

        this.loadSections();
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: err?.error?.message || 'No se pudo cargar la estructura academica.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  loadSections(): void {
    if (!this.selectedYearId) {
      this.sections = [];
      this.buildGroups();
      this.loading = false;
      return;
    }

    this.sectionsLoading = true;

    this.academicService.getSections({
      per_page: 300,
      simple: true,
      academic_year_id: this.selectedYearId,
    }).subscribe({
      next: (response) => {
        this.sections = this.extractCollection<Section>(response);
        this.buildGroups();
        this.loading = false;
        this.sectionsLoading = false;
      },
      error: (err) => {
        this.loading = false;
        this.sectionsLoading = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: err?.error?.message || 'No se pudieron cargar las secciones.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  onYearChange(): void {
    this.loadSections();
  }

  private buildGroups(): void {
    const byLevel: Record<string, GradeWithSections[]> = {};

    this.grades
      .slice()
      .sort((left, right) => left.grade - right.grade)
      .forEach((grade) => {
        if (!byLevel[grade.level]) {
          byLevel[grade.level] = [];
        }

        byLevel[grade.level].push({
          grade,
          sections: this.sections
            .filter((section) => section.grade_level_id === grade.id)
            .sort((left, right) => this.sectionDisplayName(left).localeCompare(this.sectionDisplayName(right))),
        });
      });

    const levels = Object.keys(byLevel)
      .sort((left, right) => (this.levelOrder[left] ?? 99) - (this.levelOrder[right] ?? 99));

    this.levelGroups = levels.map((levelName, index) => ({
      levelName,
      expanded: this.expandedLevels[levelName] ?? index === 0,
      grades: byLevel[levelName],
    }));
  }

  toggleLevel(group: LevelGroup): void {
    group.expanded = !group.expanded;
    this.expandedLevels[group.levelName] = group.expanded;
  }

  levelLabel(levelName: string): string {
    return this.levelMeta[levelName]?.label || levelName;
  }

  levelAccent(levelName: string): string {
    return this.levelMeta[levelName]?.accent || 'border-slate-400';
  }

  levelBadge(levelName: string): string {
    return this.levelMeta[levelName]?.badge || 'bg-gradient-to-br from-slate-500 to-slate-700';
  }

  levelChip(levelName: string): string {
    return this.levelMeta[levelName]?.chip || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  levelSectionsCount(group: LevelGroup): number {
    return group.grades.reduce((sum, item) => sum + item.sections.length, 0);
  }

  humanizeLevel(level: string): string {
    return this.levelLabel(level);
  }

  get missingLevels(): Array<{ id: string; name: string }> {
    const present = new Set(this.levelGroups.map((g) => g.levelName));
    return Object.keys(this.levelOrder)
      .filter((level) => !present.has(level))
      .sort((left, right) => this.levelOrder[left] - this.levelOrder[right])
      .map((level) => ({ id: level, name: this.levelLabel(level) }));
  }

  get allLevelsCreated(): boolean {
    return this.missingLevels.length === 0;
  }

  getLevelGradesCount(levelName: string): number {
    const group = this.levelGroups.find(g => g.levelName === levelName);
    return group ? group.grades.length : 0;
  }

  isLevelAtMaxGrades(levelName: string): boolean {
    const count = this.getLevelGradesCount(levelName);
    const max = this.maxGradesByLevel[levelName];
    return max !== undefined && count >= max;
  }

  getMaxGradesForLevel(levelName: string): number {
    return this.maxGradesByLevel[levelName] ?? 0;
  }

  getLevelGradeLimitsTooltip(levelName: string): string {
    const max = this.maxGradesByLevel[levelName];
    if (!max) return '';
    const current = this.getLevelGradesCount(levelName);
    return `Nivel ${this.levelLabel(levelName)}: ${current}/${max} grados configurados.`;
  }

  openLevelModal(): void {
    this.levelForm.reset({ level: this.missingLevels[0]?.id || '' });
    this.levelForm.markAsPristine();
    this.levelForm.markAsUntouched();
    this.showLevelModal = true;
  }

  closeLevelModal(): void {
    this.showLevelModal = false;
    this.levelSubmitting = false;
  }

  saveLevel(): void {
    if (this.levelForm.invalid) {
      this.levelForm.markAllAsTouched();
      return;
    }

    const level = String(this.levelForm.value.level || '').trim().toLowerCase();
    this.levelSubmitting = true;

    this.academicService.createGradeLevel({
      level,
      grade: 1,
      name: this.firstGradeNameByLevel[level] || `1er Grado de ${this.levelLabel(level)}`,
    }).subscribe({
      next: () => {
        this.levelSubmitting = false;
        this.closeLevelModal();
        this.loadData();
        Swal.fire({
          ...this.iosSwalStyles,
          icon: 'success',
          title: `Nivel ${this.levelLabel(level)} creado`,
          text: 'Se registro el primer grado de este nivel. Usa "Crear Grado" para agregar el resto.',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.levelSubmitting = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: this.resolveErrorMessage(err, 'No se pudo crear el nivel.'),
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  isLevelFieldInvalid(field: string): boolean {
    const ctrl = this.levelForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  /**
   * Genera de una vez los 3 niveles estandar (usado desde el estado vacio
   * global, cuando la BD todavia no tiene ningun grado). Idempotente por
   * nivel: si alguno ya tiene grados, generateStandardGrades no duplica nada.
   */
  generateAllStandardLevels(): void {
    this.generatingAllLevels = true;

    const levels = Object.keys(this.levelOrder);
    let pending = levels.length;
    let totalCreated = 0;

    levels.forEach((level) => {
      this.academicService.generateStandardGrades(level).subscribe({
        next: (res) => {
          totalCreated += res.created?.length ?? 0;
          pending--;
          if (pending === 0) this.finishGenerateAllLevels(totalCreated);
        },
        error: () => {
          pending--;
          if (pending === 0) this.finishGenerateAllLevels(totalCreated);
        },
      });
    });
  }

  private finishGenerateAllLevels(totalCreated: number): void {
    this.generatingAllLevels = false;
    this.loadData();
    Swal.fire({
      ...this.iosSwalStyles,
      icon: 'success',
      title: 'Estructura estandar generada',
      text: `Se crearon ${totalCreated} grado(s) en los 3 niveles (Inicial, Primaria, Secundaria).`,
      toast: true,
      position: 'top-end',
      timer: 4000,
      showConfirmButton: false,
    });
  }

  openCreateGradeOptions(group: LevelGroup): void {
    if (this.isLevelAtMaxGrades(group.levelName)) {
      Swal.fire({
        ...this.iosSwalStyles,
        title: 'Límite alcanzado',
        text: `El nivel ${this.levelLabel(group.levelName)} ya tiene el máximo de ${this.getMaxGradesForLevel(group.levelName)} grados permitidos.`,
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    Swal.fire({
      ...this.iosSwalStyles,
      title: 'Crear grado',
      text: '¿Cómo quieres crear el grado?',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Crear Niveles Automáticamente',
      denyButtonText: 'Crear grado manualmente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d4ed8',
    }).then((result) => {
      if (result.isConfirmed) {
        this.checkMissingGrades(group.levelName);
      } else if (result.isDenied) {
        this.openGradeModal(undefined, group.levelName);
      }
    });
  }

  checkMissingGrades(levelName: string): void {
    this.generatingMissingGrades[levelName] = true;

    this.academicService.getMissingStandardGrades(levelName).subscribe({
      next: (res) => {
        this.generatingMissingGrades[levelName] = false;

        if (!res.missing.length) {
          Swal.fire({
            ...this.iosSwalStyles,
            title: 'Todo completo',
            text: `El nivel ${this.levelLabel(levelName)} ya tiene todos sus grados estandar.`,
            icon: 'info',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1d4ed8',
          });
          return;
        }

        const listHtml = res.missing
          .map((m) => `<li class="text-left">Orden ${m.grade}: <strong>${m.name}</strong></li>`)
          .join('');

        Swal.fire({
          ...this.iosSwalStyles,
          title: `Crear ${res.missing.length} grado(s) faltante(s)`,
          html: `<p class="text-sm text-slate-500 mb-3">Se creara lo siguiente en el nivel ${this.levelLabel(levelName)}:</p><ul class="list-disc pl-5 space-y-1">${listHtml}</ul>`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Crear grados faltantes',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#1d4ed8',
        }).then((result) => {
          if (!result.isConfirmed) return;
          this.runGenerateMissingGrades(levelName);
        });
      },
      error: (err) => {
        this.generatingMissingGrades[levelName] = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: this.resolveErrorMessage(err, 'No se pudo verificar los grados faltantes.'),
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  private runGenerateMissingGrades(levelName: string): void {
    this.generatingMissingGrades[levelName] = true;

    this.academicService.generateStandardGrades(levelName).subscribe({
      next: (res) => {
        this.generatingMissingGrades[levelName] = false;
        this.loadData();
        Swal.fire({
          ...this.iosSwalStyles,
          icon: 'success',
          title: 'Grados creados',
          text: res.message,
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.generatingMissingGrades[levelName] = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: this.resolveErrorMessage(err, 'No se pudo generar los grados faltantes.'),
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  // ── Grados ─────────────────────────────────────────────────

  gradeRelatedCount(grade: GradeLevel): number {
    return (grade.sections_count ?? 0) + (grade.courses_count ?? 0);
  }

  canDeleteGrade(grade: GradeLevel): boolean {
    return this.gradeRelatedCount(grade) === 0;
  }

  gradeDeleteTooltip(grade: GradeLevel): string {
    return this.canDeleteGrade(grade)
      ? 'Eliminar'
      : 'No puedes eliminar este grado porque tiene secciones o cursos vinculados.';
  }

  openGradeModal(grade?: GradeLevel, presetLevel?: string): void {
    this.isEditingGrade = !!grade;
    this.currentGradeEditId = grade?.id ?? null;
    this.gradeServerError = null;

    if (grade) {
      this.gradeForm.patchValue({
        level: grade.level,
        name: grade.name,
        grade: grade.grade,
      });
    } else {
      this.gradeForm.reset({ level: presetLevel || 'primaria', name: '', grade: 1 });
    }

    this.gradeForm.markAsPristine();
    this.gradeForm.markAsUntouched();
    this.showGradeModal = true;
  }

  closeGradeModal(): void {
    this.showGradeModal = false;
    this.isEditingGrade = false;
    this.currentGradeEditId = null;
    this.gradeSubmitting = false;
    this.gradeServerError = null;
  }

  saveGrade(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      return;
    }

    this.gradeSubmitting = true;
    this.gradeServerError = null;

    const payload = {
      level: String(this.gradeForm.value.level || '').trim().toLowerCase(),
      name: String(this.gradeForm.value.name || '').trim(),
      grade: Number(this.gradeForm.value.grade),
    };

    const isUpdate = this.isEditingGrade && !!this.currentGradeEditId;
    const request$ = isUpdate
      ? this.academicService.updateGradeLevel(this.currentGradeEditId!, payload)
      : this.academicService.createGradeLevel(payload);

    request$.subscribe({
      next: () => {
        this.gradeSubmitting = false;
        this.closeGradeModal();
        this.loadData();

        Swal.fire({
          ...this.iosSwalStyles,
          icon: 'success',
          title: isUpdate ? 'Grado actualizado' : 'Grado registrado',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.gradeSubmitting = false;

        if (!this.handleGradeServerErrors(err)) {
          Swal.fire({
            ...this.iosSwalStyles,
            icon: 'error',
            title: 'No se pudo guardar',
            text: this.resolveErrorMessage(err, 'Hubo un error al guardar el grado.'),
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1d4ed8',
          });
        }
      },
    });
  }

  deleteGrade(grade: GradeLevel): void {
    if (!this.canDeleteGrade(grade)) {
      Swal.fire({
        ...this.iosSwalStyles,
        title: 'Accion no permitida',
        text: this.gradeDeleteTooltip(grade),
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    Swal.fire({
      ...this.iosSwalStyles,
      title: '¿Eliminar grado?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deleteGradeLevel(grade.id).subscribe({
        next: () => {
          Swal.fire({
            ...this.iosSwalStyles,
            icon: 'success',
            title: 'Eliminado',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
          this.loadData();
        },
        error: (err) => {
          Swal.fire({
            ...this.iosSwalStyles,
            title: 'Error',
            text: this.resolveErrorMessage(err, 'No se pudo eliminar el grado.'),
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1d4ed8',
          });
        },
      });
    });
  }

  isGradeFieldInvalid(field: string): boolean {
    const ctrl = this.gradeForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ── Secciones ──────────────────────────────────────────────

  sectionDisplayName(section: Section): string {
    return String(section.name || section.section_letter || '').toUpperCase();
  }

  occupiedSeats(section: Section): number {
    return Number(section.students_count ?? 0);
  }

  availableSeats(section: Section): number {
    return Math.max(Number(section.capacity || 0) - this.occupiedSeats(section), 0);
  }

  sectionRelatedCount(section: Section): number {
    return (section.students_count ?? 0)
      + (section.student_course_enrollments_count ?? 0)
      + (section.teacher_course_assignments_count ?? 0)
      + (section.course_schedules_count ?? 0)
      + (section.assignments_count ?? 0)
      + (section.announcements_count ?? 0)
      + (section.attendances_count ?? 0);
  }

  canDeleteSection(section: Section): boolean {
    return this.sectionRelatedCount(section) === 0;
  }

  sectionDeleteTooltip(section: Section): string {
    return this.canDeleteSection(section)
      ? 'Eliminar'
      : 'No puedes eliminar esta seccion porque tiene registros vinculados.';
  }

  openSectionModal(grade?: GradeLevel, section?: Section): void {
    this.isEditingSection = !!section;

    if (section) {
      this.currentSectionEditId = section.id;
      this.sectionForm.patchValue({
        grade_level_id: section.grade_level_id,
        name: this.sectionDisplayName(section),
        capacity: section.capacity,
      });
    } else {
      this.currentSectionEditId = null;
      this.sectionForm.reset({
        grade_level_id: grade?.id || '',
        name: '',
        capacity: 30,
      });
    }

    this.sectionForm.markAsPristine();
    this.sectionForm.markAsUntouched();
    this.showSectionModal = true;
  }

  closeSectionModal(): void {
    this.showSectionModal = false;
    this.isEditingSection = false;
    this.currentSectionEditId = null;
    this.sectionSubmitting = false;
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    if (!this.selectedYearId && !this.isEditingSection) {
      Swal.fire({
        ...this.iosSwalStyles,
        title: 'Error',
        text: 'Selecciona un año academico antes de registrar secciones.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    this.sectionSubmitting = true;

    const payload: any = {
      grade_level_id: this.sectionForm.value.grade_level_id,
      section_letter: String(this.sectionForm.value.name || '').trim().toUpperCase(),
      name: String(this.sectionForm.value.name || '').trim().toUpperCase(),
      capacity: Number(this.sectionForm.value.capacity),
    };

    if (!this.isEditingSection) {
      payload.academic_year_id = this.selectedYearId;
    }

    const isUpdate = this.isEditingSection && !!this.currentSectionEditId;
    const request$ = isUpdate
      ? this.academicService.updateSection(this.currentSectionEditId!, payload)
      : this.academicService.createSection(payload);

    request$.subscribe({
      next: () => {
        this.sectionSubmitting = false;
        this.closeSectionModal();
        Swal.fire({
          ...this.iosSwalStyles,
          icon: 'success',
          title: isUpdate ? 'Seccion actualizada' : 'Seccion registrada',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        this.loadData();
      },
      error: (err) => {
        this.sectionSubmitting = false;
        Swal.fire({
          ...this.iosSwalStyles,
          title: 'Error',
          text: this.resolveErrorMessage(err, 'Hubo un error al guardar la seccion.'),
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1d4ed8',
        });
      },
    });
  }

  deleteSection(section: Section, event?: Event): void {
    event?.stopPropagation();

    if (!this.canDeleteSection(section)) {
      Swal.fire({
        ...this.iosSwalStyles,
        title: 'Accion no permitida',
        text: this.sectionDeleteTooltip(section),
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    Swal.fire({
      ...this.iosSwalStyles,
      title: '¿Eliminar seccion?',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.academicService.deleteSection(section.id).subscribe({
        next: () => {
          Swal.fire({
            ...this.iosSwalStyles,
            icon: 'success',
            title: 'Eliminada',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
          });
          this.loadData();
        },
        error: (err) => {
          Swal.fire({
            ...this.iosSwalStyles,
            title: 'Error',
            text: err?.error?.message || 'No se pudo eliminar la seccion.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#1d4ed8',
          });
        },
      });
    });
  }

  isSectionFieldInvalid(field: string): boolean {
    const ctrl = this.sectionForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ── Helpers ────────────────────────────────────────────────

  private handleGradeServerErrors(err: any): boolean {
    const errors = err?.error?.errors;

    if (!errors) {
      return false;
    }

    if (errors['grade']?.length) {
      this.gradeServerError = errors['grade'][0];
      this.gradeForm.get('grade')?.setErrors({ serverError: true });
      return true;
    }

    if (errors['name']?.length) {
      this.gradeForm.get('name')?.setErrors({ serverError: true });
    }

    return false;
  }

  private resolveErrorMessage(err: any, fallback: string): string {
    const errors = err?.error?.errors;

    if (!errors) {
      return err?.error?.message || fallback;
    }

    return (Object.values(errors).flat()[0] as string) || fallback;
  }

  private extractCollection<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }
}
