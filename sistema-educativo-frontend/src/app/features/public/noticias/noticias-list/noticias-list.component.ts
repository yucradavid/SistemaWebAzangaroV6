//src/app/features/public/noticias/noticias-list/noticias-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, NewsItem } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-noticias-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './noticias-list.component.html',
  styleUrl: './noticias-list.component.css'
})
export class NoticiasListComponent implements OnInit {

   private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  readonly news = this.dataService.news;
  ngOnInit(): void { this.seoService.updateTitle('Noticias y Eventos - CERMAT SCHOOL'); }
  formatDate(d: string): string { return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }); }
}



