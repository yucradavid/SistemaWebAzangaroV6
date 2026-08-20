import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setting-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setting-metric-card.component.html'
})
export class SettingMetricCardComponent {
  @Input() label: string = '';
  @Input() value: any = '';
}
