import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createIcons, icons } from 'lucide';

@Component({
  selector: 'app-apoderado-metrics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './apoderado-metrics.component.html',
  styleUrls: ['./apoderado-metrics.component.css']
})
export class ApoderadoMetricsComponent implements OnInit, AfterViewInit {
  metrics = [
    { label: 'Asistencia Anual', value: '98%', icon: 'calendar', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tareas Completadas', value: '45/50', icon: 'check-circle', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Promedio General', value: '17.2', icon: 'trending-up', color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    createIcons({ icons });
  }
}
