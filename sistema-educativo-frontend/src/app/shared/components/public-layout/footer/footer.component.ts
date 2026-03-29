import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data_general/data.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

 private readonly dataService = inject(DataService);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks = [
    { label: 'Inicio', route: '/' },
    { label: 'Proceso de Admisión', route: '/admision' },
    { label: 'Plana Docente', route: '/docentes' },
    { label: 'Noticias y Eventos', route: '/noticias' },
    { label: 'Contáctanos', route: '/contacto' }
  ];
}
