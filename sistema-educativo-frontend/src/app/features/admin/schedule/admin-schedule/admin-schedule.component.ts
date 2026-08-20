import { Component, OnInit, inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';
import { AcademicService, Course, GradeLevel, Section } from '@core/services/academic.service';
import { ScheduleService } from '@core/services/schedule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BackButtonComponent],
  templateUrl: './admin-schedule.component.html',
  styleUrls: ['./admin-schedule.component.css']
})
export class AdminScheduleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academicService = inject(AcademicService);
  private scheduleService = inject(ScheduleService);

  gridStartHour = 7;
  gridEndHour = 16;
  maxDays = 6;
  gridHeight = 1000;

  days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' }
  ];

  colorPalette = ['bg-[#8B5CF6]', 'bg-[#10B981]', 'bg-[#00A1DE]', 'bg-[#84CC16]', 'bg-[#EC4899]', 'bg-[#F59E0B]', 'bg-[#EF4444]', 'bg-[#06B6D4]', 'bg-[#6366F1]'];
  courseColorMap: Record<string, string> = {};

  grades: GradeLevel[] = [];
  sections: Section[] = [];
  courses: Course[] = [];
  teachers: any[] = [];
  schedules: any[] = [];

  selectedGradeId = '';
  selectedSectionId = '';
  activeAcademicYearId = '';

  loading = false;
  showModal = false;
  saving = false;
  overlapError = false;
  editingBlockId: string | null = null;
  scheduleForm: FormGroup;

  // BATCH PLANNING STATE
  pendingChanges: Record<string, any> = {}; 
  selectedChangeIds: Set<string> = new Set();
  showBatchModal = false;

  toggleSelection(id: string) {
    if (this.selectedChangeIds.has(id)) {
      this.selectedChangeIds.delete(id);
    } else {
      this.selectedChangeIds.add(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedChangeIds.has(id);
  }

  draggingBlock: any = null;
  resizeType: 'top' | 'bottom' | null = null;
  dragStartY = 0;
  dragStartMinutes = 0;
  dragStartEndMinutes = 0;

  constructor() {
    this.scheduleForm = this.fb.group({
      course_id: ['', Validators.required],
      teacher_id: [''],
      day_of_week: [1, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      room_number: ['']
    });

    this.scheduleForm.valueChanges.subscribe(() => {
      this.checkConflicts();
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.draggingBlock) return;
    
    const miniGrid = document.querySelector('.relative.grid-cols-\\[70px_repeat\\(var\\(--days-count\\)\\,1fr\\)\\]');
    if (!miniGrid) return;

    const rect = miniGrid.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    const minutes = Math.round(((relativeY / 650) * totalMinutes + (this.gridStartHour * 60)) / 15) * 15;

    if (this.resizeType === 'top') {
      const currentEnd = this.timeToMinutes(this.scheduleForm.get('end_time')?.value);
      if (minutes < currentEnd) {
        this.scheduleForm.patchValue({ start_time: this.minutesToTime(minutes) });
        this.updatePendingChange();
      }
    } else if (this.resizeType === 'bottom') {
      const currentStart = this.timeToMinutes(this.scheduleForm.get('start_time')?.value);
      if (minutes > currentStart) {
        this.scheduleForm.patchValue({ end_time: this.minutesToTime(minutes) });
        this.updatePendingChange();
      }
    } else {
      const deltaMinutes = minutes - this.dragStartY;
      const newStart = Math.max(this.gridStartHour * 60, Math.min(this.gridEndHour * 60, this.dragStartMinutes + deltaMinutes));
      const duration = this.dragStartEndMinutes - this.dragStartMinutes;
      const newEnd = newStart + duration;

      if (newEnd <= this.gridEndHour * 60) {
        this.scheduleForm.patchValue({
          start_time: this.minutesToTime(newStart),
          end_time: this.minutesToTime(newEnd)
        });
      }

      const relativeX = event.clientX - rect.left - 70;
      const columnWidth = (rect.width - 70) / this.maxDays;
      const dayIndex = Math.floor(relativeX / columnWidth) + 1;
      if (dayIndex >= 1 && dayIndex <= this.maxDays) {
        this.scheduleForm.patchValue({ day_of_week: dayIndex });
      }
      this.updatePendingChange();
    }
  }

  updatePendingChange() {
    if (this.editingBlockId) {
      const formVal = this.scheduleForm.getRawValue();
      const original = this.schedules.find(s => s.id === this.editingBlockId);
      this.pendingChanges[this.editingBlockId] = {
        ...original,
        ...formVal
      };
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.draggingBlock = null;
    this.resizeType = null;
  }

  onMouseDownGhost(event: MouseEvent) {
    event.preventDefault();
    this.draggingBlock = { id: 'GHOST' };
    this.resizeType = null;
    this.initDragData(event, this.scheduleForm.get('start_time')?.value, this.scheduleForm.get('end_time')?.value);
  }

  onResizeStartGhost(event: MouseEvent, type: 'top' | 'bottom') {
    event.stopPropagation();
    event.preventDefault();
    this.draggingBlock = { id: 'GHOST' };
    this.resizeType = type;
  }

  private initDragData(event: MouseEvent, startTime: string, endTime: string) {
    const miniGrid = document.querySelector('.relative.grid-cols-\\[70px_repeat\\(var\\(--days-count\\)\\,1fr\\)\\]');
    if (miniGrid) {
      const rect = miniGrid.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
      this.dragStartY = Math.round(((relativeY / 650) * totalMinutes + (this.gridStartHour * 60)) / 15) * 15;
      this.dragStartMinutes = this.timeToMinutes(startTime);
      this.dragStartEndMinutes = this.timeToMinutes(endTime);
    }
  }

  onMouseDown(event: MouseEvent, block: any) {
    event.preventDefault();
    this.editBlock(block);
    this.draggingBlock = block;
    this.resizeType = null;
    this.initDragData(event, block.start_time, block.end_time);
  }

  onResizeStart(event: MouseEvent, block: any, type: 'top' | 'bottom') {
    event.stopPropagation();
    event.preventDefault();
    this.editBlock(block);
    this.draggingBlock = block;
    this.resizeType = type;
  }

  ngOnInit() {
    this.loadViewPreference();
    this.loadAcademicYears();
    this.loadGrades();
    this.loadTeachers();
  }

  private loadViewPreference() {
    const savedDays = localStorage.getItem('admin_schedule_max_days');
    if (savedDays) this.maxDays = parseInt(savedDays, 10);
    
    const savedStart = localStorage.getItem('admin_schedule_start_hour');
    if (savedStart) this.gridStartHour = parseInt(savedStart, 10);
    
    const savedEnd = localStorage.getItem('admin_schedule_end_hour');
    if (savedEnd) this.gridEndHour = parseInt(savedEnd, 10);
  }

  onViewPreferenceChange() {
    localStorage.setItem('admin_schedule_max_days', this.maxDays.toString());
    localStorage.setItem('admin_schedule_start_hour', this.gridStartHour.toString());
    localStorage.setItem('admin_schedule_end_hour', this.gridEndHour.toString());
    this.updateSuggestions();
  }

  getVisibleDays() {
    return this.days.slice(0, this.maxDays);
  }

  getHourLabels() {
    const hours = [];
    for (let i = this.gridStartHour; i <= this.gridEndHour; i++) hours.push(i);
    return hours;
  }

  getTopPosition(timeStr: string): number {
    if (!timeStr) return 0;
    const minutes = this.timeToMinutes(timeStr);
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    return ((minutes - (this.gridStartHour * 60)) / totalMinutes) * 100;
  }

  getHeightPercent(start: string, end: string): number {
    if (!start || !end) return 0;
    const diff = this.timeToMinutes(end) - this.timeToMinutes(start);
    const totalRange = (this.gridEndHour - this.gridStartHour) * 60;
    return (diff / totalRange) * 100;
  }

  checkConflicts() {
    const { start_time, end_time, day_of_week } = this.scheduleForm.getRawValue();
    if (!start_time || !end_time || !day_of_week) { this.overlapError = false; return; }
    const startMin = this.timeToMinutes(start_time);
    const endMin = this.timeToMinutes(end_time);
    if (endMin <= startMin) { this.overlapError = true; return; }
    const merged = this.schedules.map(s => this.pendingChanges[s.id] || s);
    this.overlapError = merged.some(block => {
      if (this.editingBlockId === block.id) return false;
      if (Number(block.day_of_week) !== Number(day_of_week)) return false;
      const bStart = this.timeToMinutes(block.start_time);
      const bEnd = this.timeToMinutes(block.end_time);
      return (startMin < bEnd) && (endMin > bStart);
    });

    this.updateSuggestions();
  }

  get currentFormDay(): number {
    return Number(this.scheduleForm.get('day_of_week')?.value);
  }

  // ALGORITMO INTELIGENTE DE HUECOS LIBRES (Estabilizado)
  suggestions: any[] = [];

  getSlotsByDay(dayId: number): any[] {
    return this.suggestions.filter(s => s.dayId === dayId);
  }

  updateSuggestions() {
    const slots: any[] = [];
    const gridStart = this.gridStartHour * 60;
    const gridEnd = this.gridEndHour * 60;
    const minGapMinutes = 15;

    this.getVisibleDays().forEach(day => {
      const dayBlocks = this.getSchedulesByDay(day.id)
        .filter(b => b.id !== this.editingBlockId)
        .map(b => ({ start: this.timeToMinutes(b.start_time), end: this.timeToMinutes(b.end_time) }))
        .sort((a, b) => a.start - b.start);

      let currentPointer = gridStart;

      dayBlocks.forEach(block => {
        if (block.start - currentPointer >= minGapMinutes) {
          slots.push({ dayId: day.id, start: currentPointer, end: block.start });
        }
        currentPointer = Math.max(currentPointer, block.end);
      });

      if (gridEnd - currentPointer >= minGapMinutes) {
        slots.push({ dayId: day.id, start: currentPointer, end: gridEnd });
      }
    });

    this.suggestions = slots;
  }

  applySuggestion(slot: any) {
    const startStr = this.minutesToTime(slot.start);
    const endStr = this.minutesToTime(slot.end);

    this.scheduleForm.patchValue({
      day_of_week: slot.dayId,
      start_time: startStr,
      end_time: endStr
    });
    
    this.updateSuggestions();
    this.checkConflicts();
    Swal.fire({ icon: 'success', title: 'Espacio optimizado aplicado', text: `Rango sugerido: ${startStr} - ${endStr}`, toast: true, position: 'top-end', timer: 2500, showConfirmButton: false });
  }

  getTopPositionFromMinutes(minutes: number): number {
    const totalMinutes = (this.gridEndHour - this.gridStartHour) * 60;
    return ((minutes - (this.gridStartHour * 60)) / totalMinutes) * 100;
  }

  getHeightPercentFromMinutes(start: number, end: number): number {
    const totalRange = (this.gridEndHour - this.gridStartHour) * 60;
    return ((end - start) / totalRange) * 100;
  }

  minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private loadAcademicYears() {
    this.academicService.getAcademicYears({ per_page: 200 }).subscribe({
      next: (response) => {
        const items = this.extractItems<any>(response);
        const activeYear = items.find((year) => year.is_active);
        this.activeAcademicYearId = activeYear?.id || '';
      }
    });
  }

  private loadGrades() {
    this.academicService.getGradeLevels({ per_page: 200 }).subscribe({
      next: (response) => this.grades = this.extractItems<GradeLevel>(response)
    });
  }

  private loadTeachers() {
    this.academicService.getTeachers({ per_page: 200 }).subscribe({
      next: (response) => this.teachers = this.extractItems<any>(response)
    });
  }

  onGradeChange() {
    this.sections = []; this.selectedSectionId = ''; if (!this.selectedGradeId) return;
    this.academicService.getSections({ academic_year_id: this.activeAcademicYearId, grade_level_id: this.selectedGradeId, per_page: 200 }).subscribe({
      next: (response) => this.sections = this.extractItems<Section>(response)
    });
  }

  onSectionChange() { if (!this.selectedSectionId) return; this.loadCoursesForSection(); this.loadSchedules(); }
  private loadCoursesForSection() { this.academicService.getCourses({ section_id: this.selectedSectionId, academic_year_id: this.activeAcademicYearId, per_page: 200 }).subscribe({ next: (response) => this.courses = this.extractItems<Course>(response) }); }
  getPendingChangesCount(): number {
    return Object.keys(this.pendingChanges).length;
  }

  removePendingChange(id: string) {
    delete this.pendingChanges[id];
    if (this.getPendingChangesCount() === 0) {
      this.showBatchModal = false;
    }
  }

  saveBatchChanges() {
    let selectedIds = Array.from(this.selectedChangeIds);
    if (selectedIds.length === 0) return;

    // 1. VALIDACIÓN DE DEPENDENCIAS (Verificar si faltan liberadores de espacio)
    for (const id of selectedIds) {
      const nextPos = this.pendingChanges[id];
      // Buscar quién ocupa este sitio actualmente en la base de datos
      const blocker = this.schedules.find(s => s.id !== id && this.checkOverlap(nextPos, s));
      
      if (blocker) {
        // Si el bloqueador tiene un cambio pendiente pero NO ha sido seleccionado
        if (this.pendingChanges[blocker.id] && !this.selectedChangeIds.has(blocker.id)) {
          const targetName = this.getCourseName(nextPos.course_id, nextPos);
          const blockerName = this.getCourseName(blocker.course_id, blocker);
          
          Swal.fire({
            icon: 'info',
            title: 'Acción requerida',
            text: `Para mover "${targetName}", primero debes incluir en el guardado el cambio de "${blockerName}" para que libere el espacio.`,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#4f46e5'
          });
          return;
        }
      }
    }

    // 2. ALGORITMO DE PRIORIDAD DE LIBERACIÓN (Sorting de dependencias)
    selectedIds.sort((idA, idB) => {
      const nextA = this.pendingChanges[idA];
      const nextB = this.pendingChanges[idB];
      const prevA = this.schedules.find(s => s.id === idA);
      const prevB = this.schedules.find(s => s.id === idB);
      if (!prevA || !prevB) return 0;

      // ¿A quiere entrar donde todavía está B? (B debe ir antes)
      const aNeedsBToMove = this.checkOverlap(nextA, prevB);
      // ¿B quiere entrar donde todavía está A? (A debe ir antes)
      const bNeedsAToMove = this.checkOverlap(nextB, prevA);

      if (aNeedsBToMove && !bNeedsAToMove) return 1; // B va primero
      if (bNeedsAToMove && !aNeedsBToMove) return -1; // A va primero
      return 0;
    });

    this.saving = true;
    
    // GUARDADO SECUENCIAL ROBUSTO
    import('rxjs').then(({ from, concatMap, of, catchError, finalize }) => {
      from(selectedIds).pipe(
        concatMap(id => {
          const rawItem = this.pendingChanges[id];
          const payload = {
            course_id: rawItem.course_id,
            teacher_id: rawItem.teacher_id || '',
            day_of_week: Number(rawItem.day_of_week),
            start_time: this.formatTime(rawItem.start_time),
            end_time: this.formatTime(rawItem.end_time),
            room_number: rawItem.room_number || '',
            academic_year_id: this.activeAcademicYearId,
            section_id: this.selectedSectionId
          };

          return this.scheduleService.updateSchedule(id, payload).pipe(
            catchError(err => {
              const serverMsg = err.error?.message || err.error?.error || 'Conflicto de validación';
              return of({ error: true, id, msg: serverMsg });
            })
          );
        }),
        finalize(() => {
          this.saving = false;
          this.loadSchedules();
        })
      ).subscribe({
        next: (res: any) => {
          if (res && !res.error) {
            // El concatMap garantiza orden, así que podemos usar shift() sobre la lista ordenada
            const currentId = selectedIds.shift();
            if (currentId) {
              delete this.pendingChanges[currentId];
              this.selectedChangeIds.delete(currentId);
            }
          } else if (res.error) {
            const courseName = this.getCourseName(this.pendingChanges[res.id]?.course_id);
            Swal.fire({ 
              icon: 'error', 
              title: `Error en ${courseName}`, 
              text: res.msg,
              toast: true, position: 'top-end', timer: 5000 
            });
            selectedIds.shift();
          }
        },
        complete: () => {
          if (this.getPendingChangesCount() === 0) {
            Swal.fire({ icon: 'success', title: '¡Hecho!', text: 'Todos los cambios se sincronizaron en el orden correcto.', toast: true, position: 'top-end', timer: 3000 });
          }
        }
      });
    });
  }

  // Helper para detectar solapamiento entre un bloque nuevo y uno antiguo
  private checkOverlap(blockA: any, blockB: any): boolean {
    if (Number(blockA.day_of_week) !== Number(blockB.day_of_week)) return false;
    const startA = this.timeToMinutes(blockA.start_time);
    const endA = this.timeToMinutes(blockA.end_time);
    const startB = this.timeToMinutes(blockB.start_time);
    const endB = this.timeToMinutes(blockB.end_time);
    return (startA < endB && endA > startB);
  }

  discardAllChanges() {
    Swal.fire({ title: '¿Descartar todo?', text: 'Se perderán todos los movimientos que no hayas guardado.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, descartar', cancelButtonText: 'Mantener' }).then(result => {
      if (result.isConfirmed) {
        this.pendingChanges = {};
        this.selectedChangeIds.clear();
      }
    });
  }

  loadSchedules() { this.loading = true; this.scheduleService.getSchedules({ academic_year_id: this.activeAcademicYearId, section_id: this.selectedSectionId, per_page: 200, sort: 'day_of_week', dir: 'asc' }).subscribe({ next: (response) => { this.schedules = this.extractItems<any>(response); this.assignColors(); this.loading = false; }, error: () => this.loading = false }); }
  private extractItems<T>(response: any): T[] { if (Array.isArray(response)) return response; return response?.data?.data || response?.data || []; }
  assignColors() { this.courseColorMap = {}; const uniqueIds = [...new Set(this.schedules.map(s => s.course_id))]; uniqueIds.forEach((id, idx) => this.courseColorMap[id] = this.colorPalette[idx % this.colorPalette.length]); }
  getSchedulesByDay(dayId: number) {
    const merged = this.schedules.map(s => this.pendingChanges[s.id] || s);
    return merged.filter((s) => Number(s.day_of_week) === dayId).sort((a, b) => this.timeToMinutes(a.start_time) - this.timeToMinutes(b.start_time));
  }
  openModal() { if (this.courses.length === 0) { Swal.fire('Sin cursos', 'La sección no tiene cursos configurados.', 'warning'); return; } this.resetFormToNew(); this.showModal = true; this.updateSuggestions(); }
  closeModal() { this.showModal = false; this.overlapError = false; this.editingBlockId = null; }
  editBlock(block: any) { this.editingBlockId = block.id; this.scheduleForm.patchValue({ course_id: block.course_id, teacher_id: block.teacher_id || '', day_of_week: Number(block.day_of_week), start_time: this.formatTime(block.start_time), end_time: this.formatTime(block.end_time), room_number: block.room_number || '' }); this.showModal = true; this.updateSuggestions(); }
  resetFormToNew() { this.editingBlockId = null; this.scheduleForm.reset({ course_id: '', teacher_id: '', day_of_week: 1, start_time: '08:00', end_time: '09:00', room_number: '' }); }
  saveBlock() {
    if (this.scheduleForm.invalid || this.overlapError) return;
    this.saving = true;
    const payload = { ...this.scheduleForm.getRawValue(), academic_year_id: this.activeAcademicYearId, section_id: this.selectedSectionId };
    const request$ = this.editingBlockId ? this.scheduleService.updateSchedule(this.editingBlockId, payload) : this.scheduleService.createSchedule(payload);
    
    request$.subscribe({
      next: () => {
        this.saving = false;
        if (this.editingBlockId) {
          delete this.pendingChanges[this.editingBlockId];
          this.selectedChangeIds.delete(this.editingBlockId);
        }
        this.closeModal();
        this.loadSchedules();
        Swal.fire({ icon: 'success', title: 'Horario actualizado', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.error?.error || 'No se pudo guardar el bloque.';
        Swal.fire('Error de Validación', msg, 'error');
      }
    });
  }
  deleteBlock(id: string, event: Event) { event.stopPropagation(); Swal.fire({ title: '¿Eliminar bloque?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' }).then((result) => { if (result.isConfirmed) { this.scheduleService.deleteSchedule(id).subscribe({ next: () => { this.loadSchedules(); Swal.fire('Eliminado', '', 'success'); } }); } }); }
  printSchedule() { window.print(); }
  private timeToMinutes(timeStr: string): number { if (!timeStr) return 0; const [h, m] = timeStr.split(':').map(Number); return h * 60 + (m || 0); }
  formatTime(timeStr: string): string { return timeStr ? timeStr.substring(0, 5) : ''; }
  getCourseColor(courseId: string): string { return this.courseColorMap[courseId] || 'bg-slate-500'; }
  getCourseName(courseId: string | number, block?: any): string { 
    if (block?.course?.name) return block.course.name;
    const idStr = String(courseId);
    return this.courses.find(c => String(c.id) === idStr)?.name || ''; 
  }
  getSelectedGradeName() { const grade = this.grades.find(g => g.id === this.selectedGradeId); return grade ? (grade.name || `${grade.level} ${grade.grade}°`) : ''; }
  getSelectedSectionLetter() { return this.sections.find(s => s.id === this.selectedSectionId)?.section_letter || ''; }
}
