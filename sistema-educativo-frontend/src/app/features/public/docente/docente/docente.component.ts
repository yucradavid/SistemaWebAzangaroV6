import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css'
})
export class DocenteComponent implements OnInit {
 private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  readonly teachers = this.dataService.teachers;
  ngOnInit(): void { this.seoService.updateTitle('Plana Docente - CERMAT SCHOOL'); }
}

