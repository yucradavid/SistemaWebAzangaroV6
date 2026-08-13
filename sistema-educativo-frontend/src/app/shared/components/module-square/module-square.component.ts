import { Component, Input, OnInit, AfterViewInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createIcons, icons } from 'lucide';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-module-square',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './module-square.component.html',
  styleUrls: ['./module-square.component.css']
})
export class ModuleSquareComponent implements OnInit, AfterViewInit {
  @Input() title!: string;
  @Input() description!: string;
  @Input() icon!: string; 
  @Input() path!: string;
  @Input() color!: string;
  @Input() customClass: string = '';
  @Input() customStyle: any = {};
  safeIcon: SafeHtml | null = null;
  isSvgIcon = false;

  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['icon']) {
      const value = this.icon || '';
      const trimmed = value.trim();
      this.isSvgIcon = trimmed.startsWith('<svg') || trimmed.startsWith('&lt;svg') || trimmed.indexOf('<path') !== -1;
      if (this.isSvgIcon) {
        this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(value);
      } else {
        this.safeIcon = null;
      }
    }
  }

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    createIcons({ icons });
  }
}

