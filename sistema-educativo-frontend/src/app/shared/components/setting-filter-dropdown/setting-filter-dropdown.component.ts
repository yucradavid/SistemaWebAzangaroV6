import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterOption {
  id: string;
  name: string;
  level?: string;
}

@Component({
  selector: 'app-setting-filter-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block w-full">
      <!-- Trigger -->
      <button
        type="button"
        (click)="toggle()"
        class="w-full bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm flex items-center justify-between gap-4 px-6 transition-all hover:shadow-md active:scale-[0.98] group">

        <div class="flex items-center gap-3">
          <div class="text-slate-400 group-hover:text-[#0E3A8A] transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          </div>
          <span class="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest truncate">
            {{ getSelectedLabel() }}
          </span>
        </div>

        <div class="text-slate-400 group-hover:text-[#0E3A8A] transition-transform duration-300" [class.rotate-180]="isOpen">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </button>

      <!-- Options Dropdown -->
      <div
        *ngIf="isOpen"
        [ngStyle]="dropdownStyles"
        class="bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-slide-up py-1 custom-scrollbar">

        <button
          (click)="select('')"
          class="w-full px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-slate-50 border-b border-slate-50"
          [class.text-[#0E3A8A]]="!selectedId"
          [class.text-slate-500]="selectedId">
          {{ placeholder }}
        </button>

        <button
          *ngFor="let opt of options"
          (click)="select(opt.id)"
          class="w-full px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-blue-50/50 group flex items-center justify-between"
          [class.bg-blue-50]="selectedId === opt.id">

          <div class="flex flex-col">
            <span [class.text-[#0E3A8A]]="selectedId === opt.id" class="text-slate-700 group-hover:text-[#0E3A8A]">
              {{ opt.name }}
            </span>
            <span *ngIf="opt.level" class="text-[8px] text-slate-400 font-medium group-hover:text-blue-400">
              {{ opt.level }}
            </span>
          </div>

          <div *ngIf="selectedId === opt.id" class="text-[#0E3A8A]">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-up { animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
  `]
})
export class SettingFilterDropdownComponent {
  @Input() options: FilterOption[] = [];
  @Input() selectedId: string = '';
  @Input() placeholder: string = 'Todos los grados';
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  dropdownStyles: Record<string, string> = {};

  constructor(private elementRef: ElementRef) {}

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.setDropdownPosition();
    }
  }

  select(id: string) {
    this.selectedId = id;
    this.selectionChange.emit(id);
    this.isOpen = false;
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen) {
      this.setDropdownPosition();
    }
  }

  private setDropdownPosition() {
    const button: HTMLElement | null = this.elementRef.nativeElement.querySelector('button');
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewHeight = window.innerHeight;
    const maxHeight = Math.max(180, Math.min(420, viewHeight - rect.bottom - 16));

    this.dropdownStyles = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: '10050',
      maxHeight: `${maxHeight}px`,
      overflowY: 'auto',
      background: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)'
    };
  }

  getSelectedLabel(): string {
    if (!this.selectedId) return this.placeholder;
    const found = this.options.find(o => o.id === this.selectedId);
    return found ? `${found.name}${found.level ? ' (' + found.level + ')' : ''}` : this.placeholder;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
