import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-levels-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './levels-section.component.html',
  styleUrl: './levels-section.component.css'
})
export class LevelsSectionComponent {
 private readonly dataService = inject(DataService);
  readonly levels = this.dataService.levels;

  getColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      'from-pink-500 to-rose-500': 'text-pink-600',
      'from-blue-500 to-cyan-500': 'text-blue-600',
      'from-purple-500 to-indigo-500': 'text-purple-600'
    };
    return colorMap[color] || 'text-blue-600';
  }
}

