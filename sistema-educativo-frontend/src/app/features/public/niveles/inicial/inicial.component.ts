import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, EducationalLevel } from '@core/services/data_general/data.service';
import { PageCoverComponent } from '@shared/components/page-cover/page-cover.component';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, PageCoverComponent],
  templateUrl: './inicial.component.html',
  styleUrl: './inicial.component.css'
})
export class InicialComponent implements OnInit {
 private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);

  levelData = this.dataService.getLevelById('inicial');

  ngOnInit(): void {
    this.seoService.updateTitle('Nivel Inicial - CERMAT SCHOOL');
  }
}

