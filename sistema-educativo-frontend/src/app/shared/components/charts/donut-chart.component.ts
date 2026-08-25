//src/app/shared/components/charts/donut-chart.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartRenderSegment extends DonutChartSegment {
  percent: number;
  dashOffset: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="segments.length === 0" class="py-16 text-center text-slate-400 text-sm">{{ emptyMessage }}</div>
    <div *ngIf="segments.length > 0" class="flex flex-col sm:flex-row items-center gap-8">
      <svg viewBox="0 0 36 36" class="w-40 h-40 flex-shrink-0">
        <g transform="rotate(-90 18 18)">
          <circle
            *ngFor="let seg of renderSegments"
            cx="18" cy="18" r="15.5"
            fill="none"
            [attr.stroke]="seg.color"
            stroke-width="5"
            pathLength="100"
            [attr.stroke-dasharray]="seg.percent + ' ' + (100 - seg.percent)"
            [attr.stroke-dashoffset]="seg.dashOffset"
          ></circle>
        </g>
      </svg>
      <div class="flex-1 w-full space-y-3">
        <div *ngFor="let seg of renderSegments" class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="seg.color"></span>
            <span class="text-sm font-medium text-slate-700">{{ seg.label }}</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-900">{{ unit }}{{ seg.value | number:decimalsFormat }}</span>
            <span class="text-xs text-slate-400 ml-2">{{ seg.percent | number:'1.0-1' }}%</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DonutChartComponent {
  @Input() set data(value: DonutChartSegment[] | null | undefined) {
    this.segments = value || [];
  }

  @Input() unit = '';
  @Input() decimals = 0;
  @Input() emptyMessage = 'Sin datos para graficar.';

  segments: DonutChartSegment[] = [];

  get decimalsFormat(): string {
    return `1.${this.decimals}-${this.decimals}`;
  }

  get renderSegments(): DonutChartRenderSegment[] {
    const total = this.segments.reduce((sum, seg) => sum + seg.value, 0);
    let cumulative = 0;

    return this.segments.map((seg) => {
      const percent = total > 0 ? (seg.value / total) * 100 : 0;
      const dashOffset = -cumulative;
      cumulative += percent;
      return { ...seg, percent, dashOffset };
    });
  }
}
