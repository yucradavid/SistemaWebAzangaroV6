import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createIcons, icons } from 'lucide';

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

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    createIcons({ icons });
  }
}

