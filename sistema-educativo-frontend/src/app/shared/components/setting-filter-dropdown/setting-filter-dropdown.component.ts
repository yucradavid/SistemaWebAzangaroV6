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
  templateUrl: './setting-filter-dropdown.component.html',
  styleUrls: ['./setting-filter-dropdown.component.css']
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
