import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createIcons, icons } from 'lucide';

@Component({
  selector: 'app-teacher-metrics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher-metrics.component.html',
  styleUrls: ['./teacher-metrics.component.css']
})
export class TeacherMetricsComponent implements OnInit, AfterViewInit {
  metrics = [
    { label: 'Asistencia Promedio', value: '95%', icon: 'users', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tareas Calificadas', value: '120/150', icon: 'check-square', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Promedio General', value: '16.5', icon: 'bar-chart', color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    createIcons({ icons });
  }
}
