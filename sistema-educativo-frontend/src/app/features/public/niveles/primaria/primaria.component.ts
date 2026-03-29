import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, EducationalLevel } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-primaria',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './primaria.component.html',
  styleUrl: './primaria.component.css'
})
export class PrimariaComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  levelData = this.dataService.getLevelById('primaria');
  ngOnInit(): void { this.seoService.updateTitle('Nivel Primaria - CERMAT SCHOOL'); }

}

