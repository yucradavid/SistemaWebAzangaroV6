
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-section.component.html',
  styleUrl: './stats-section.component.css'
})
export class StatsSectionComponent {
private readonly dataService = inject(DataService);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly yearsOfExperience = this.dataService.yearsOfExperience;
}

