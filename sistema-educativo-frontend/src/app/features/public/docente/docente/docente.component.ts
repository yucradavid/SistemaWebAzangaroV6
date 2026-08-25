import { Component, OnInit, inject } from '@angular/core';
import { LucideAngularModule, Award, Mail } from 'lucide-angular';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
import { PageHeroComponent } from '@shared/components/public/page-hero/page-hero.component';

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [LucideAngularModule, PageHeroComponent],
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css'
})
export class DocenteComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);

  readonly teachers = this.dataService.teachers;

  readonly AwardIcon = Award;
  readonly MailIcon = Mail;

  ngOnInit(): void {
    this.seoService.updateTitle('Plana Docente - CERMAT SCHOOL');
  }
}
