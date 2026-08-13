import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
import { PageCoverComponent } from '@shared/components/page-cover/page-cover.component';
@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, PageCoverComponent],
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css'
})
export class DocenteComponent implements OnInit {
 private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  readonly teachers = this.dataService.teachers;
  ngOnInit(): void { this.seoService.updateTitle('Plana Docente - CERMAT SCHOOL'); }
}

