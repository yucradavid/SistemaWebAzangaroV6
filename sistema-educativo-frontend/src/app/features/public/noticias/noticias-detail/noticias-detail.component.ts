import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, NewsItem } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-noticias-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './noticias-detail.component.html',
  styleUrl: './noticias-detail.component.css'
})
export class NoticiasDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  noticia?: NewsItem;
  otherNews: NewsItem[] = [];
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.noticia = this.dataService.getNewsById(id);
      if (this.noticia) {
        this.seoService.updateTitle(`${this.noticia.title} - CERMAT SCHOOL`);
        this.otherNews = this.dataService.news().filter(n => n.id !== this.noticia!.id).slice(0, 3);
      }
    }
  }
  formatDate(d: string): string { return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }); }

}

