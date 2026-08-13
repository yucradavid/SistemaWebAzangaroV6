import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, EducationalLevel } from '@core/services/data_general/data.service';
import { PageCoverComponent } from '@shared/components/page-cover/page-cover.component';
@Component({
  selector: 'app-secundaria',
  standalone: true,
  imports: [CommonModule, RouterLink, PageCoverComponent],
  templateUrl: './secundaria.component.html',
  styleUrl: './secundaria.component.css'
})
export class SecundariaComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  levelData = this.dataService.getLevelById('secundaria');
  ngOnInit(): void { this.seoService.updateTitle('Nivel Secundaria - CERMAT SCHOOL'); }

}

