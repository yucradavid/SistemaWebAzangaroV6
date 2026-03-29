import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-map-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-section.component.html',
  styleUrl: './map-section.component.css'
})
export class MapSectionComponent {
private readonly dataService = inject(DataService);
  readonly schoolInfo = this.dataService.schoolInfo;
}

