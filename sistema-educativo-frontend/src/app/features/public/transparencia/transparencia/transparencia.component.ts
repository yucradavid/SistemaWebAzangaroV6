import { Component, OnInit, inject, Signal } from '@angular/core';
import { LucideAngularModule, FileText, Download } from 'lucide-angular';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, TransparencyDocument } from '@core/services/data_general/data.service';
import { PageHeroComponent } from '@shared/components/public/page-hero/page-hero.component';

@Component({
  selector: 'app-transparencia',
  standalone: true,
  imports: [LucideAngularModule, PageHeroComponent],
  templateUrl: './transparencia.component.html',
  styleUrl: './transparencia.component.css'
})
export class TransparenciaComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);

  readonly documents: Signal<TransparencyDocument[]> = this.dataService.transparencyDocs;

  readonly FileIcon = FileText;
  readonly DownloadIcon = Download;

  ngOnInit(): void {
    this.seoService.updateTitle('Transparencia - CERMAT SCHOOL');
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
