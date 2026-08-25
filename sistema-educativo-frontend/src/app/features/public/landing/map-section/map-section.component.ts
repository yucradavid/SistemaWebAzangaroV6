import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataService } from '@core/services/data_general/data.service';
import { RevealGroupDirective } from '@shared/directives/reveal-group.directive';

@Component({
  selector: 'app-map-section',
  standalone: true,
  imports: [CommonModule, RevealGroupDirective],
  templateUrl: './map-section.component.html',
})
export class MapSectionComponent {
  private readonly dataService = inject(DataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.634139886916!2d-70.2016!3d-14.9089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9167e45041a79833%3A0x6b579133939e6569!2sAz%C3%A1ngaro%2C%20Puno!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe'
  );
}
