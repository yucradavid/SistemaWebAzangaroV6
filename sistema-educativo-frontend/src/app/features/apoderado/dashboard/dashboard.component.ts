import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleSquareComponent } from '../../../shared/components/module-square/module-square.component';

@Component({
  selector: 'app-apoderado-dashboard',
  standalone: true,
  imports: [CommonModule, ModuleSquareComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  modules = [
    {
      title: 'Asistencia',
      description: 'Control de asistencia y justificaciones',
      icon: 'calendar-check',
      path: '/app/attendance/apoderado',
      color: 'bg-[#1e40af]'
    },
    {
      title: 'Notas',
      description: 'Seguimiento académico',
      icon: 'graduation-cap',
      path: '/app/evaluation/apoderado',
      color: 'bg-[#1e3a8a]' // Blue 900
    },
    {
      title: 'Pagos',
      description: 'Estado de cuenta y pagos online',
      icon: 'credit-card',
      path: '/app/finance/apoderado',
      color: 'bg-[#1e40af]' // Blue 800
    },
    {
      title: 'Historial',
      description: 'Historial academico y financiero',
      icon: 'file-text',
      path: '/app/history/apoderado',
      color: 'bg-[#0f766e]'
    },
    {
      title: 'Tareas',
      description: 'Supervisión de tareas escolares',
      icon: 'book-open',
      path: '/app/tasks/apoderado',
      color: 'bg-[#ca8a04]'
    },
    {
      title: 'Comunicados',
      description: 'Circulares y avisos importantes',
      icon: 'message-square',
      path: '/app/communications/apoderado',
      color: 'bg-[#3b82f6]' // Blue 500
    },
    {
      title: 'Mensajería',
      description: 'Contacto con docentes',
      icon: 'mail',
      path: '/app/messages/apoderado',
      color: 'bg-[#0E3A8A]'
    },
    {
      title: 'Reporte',
      description: 'Progreso detallado de mis hijos',
      icon: 'activity',
      path: '/app/dashboard/metrics/apoderado',
      color: 'bg-[#ca8a04]' // Yellow 600
    },
    {
      title: 'Horario',
      description: 'Horario de clases de mis hijos',
      icon: 'clock',
      path: '/app/schedule/apoderado',
      color: 'bg-[#7c3aed]' // Violet 600
    }
  ];

  constructor() {}
  ngOnInit(): void {}
}
