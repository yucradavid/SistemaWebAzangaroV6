import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleSquareComponent } from '../../../shared/components/module-square/module-square.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ModuleSquareComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  modules = [
    {
        title: 'Asistencia',
        description: 'Registro diario de asistencia por seccion',
        icon: 'calendar-check',
        path: '/app/attendance/teacher',
        color: 'bg-[#1e40af]'
    },
    {
        title: 'Evaluacion',
        description: 'Registro de calificaciones y competencias',
        icon: 'graduation-cap',
        path: '/app/evaluation/teacher',
        color: 'bg-[#1e3a8a]'
    },
    {
        title: 'Historial',
        description: 'Cursos, tareas y asistencia cerrada',
        icon: 'file-text',
        path: '/app/history/teacher',
        color: 'bg-[#0f766e]'
    },
    {
        title: 'Tareas',
        description: 'Creacion y gestion de actividades',
        icon: 'book-open',
        path: '/app/tasks/teacher',
        color: 'bg-[#1e40af]'
    },
    {
        title: 'Calificar',
        description: 'Revision de entregas de tareas',
        icon: 'check-circle',
        path: '/app/tasks/grading/teacher',
        color: 'bg-[#ca8a04]'
    },
    {
        title: 'Comunicados',
        description: 'Envio de comunicados a padres y alumnos',
        icon: 'message-square',
        path: '/app/communications/teacher',
        color: 'bg-[#3b82f6]'
    },
    {
        title: 'Mensajeria',
        description: 'Buzon de mensajes directos',
        icon: 'mail',
        path: '/app/messages/teacher',
        color: 'bg-[#0E3A8A]'
    },
    {
        title: 'Resumen',
        description: 'Estadisticas de cursos y alumnos',
        icon: 'activity',
        path: '/app/dashboard/metrics/teacher',
        color: 'bg-[#374151]'
    },
    {
        title: 'Reportes',
        description: 'Reportes academicos y exportacion',
        icon: 'bar-chart',
        path: '/app/reports/academic',
        color: 'bg-[#ca8a04]'
    },
    {
        title: 'Mi Horario',
        description: 'Ver mi horario de clases',
        icon: 'clock',
        path: '/app/schedule/teacher',
        color: 'bg-[#7c3aed]'
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}
