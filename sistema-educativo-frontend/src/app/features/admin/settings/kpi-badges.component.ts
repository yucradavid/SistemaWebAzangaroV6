import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-badges.component.html'
})
export class KpiBadgesComponent {
  @Input() totalTeachers = 0;
  @Input() totalAssignments = 0;
  @Input() nearLimitCount = 0;
  @Input() atLimitCount = 0;
}
