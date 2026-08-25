//src/app/shared/components/charts/bar-chart.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartRenderItem extends BarChartItem {
  heightPercent: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-stretch gap-2 overflow-x-auto" [style.height.px]="height">
      <div
        *ngFor="let bar of renderBars"
        class="flex-1 flex-shrink-0 h-full flex flex-col justify-end items-center group relative"
        [style.min-width.px]="minBarWidth"
      >
        <span class="absolute -top-6 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {{ unit }}{{ bar.value | number:decimalsFormat }}
        </span>
        <div class="w-full rounded-t-md min-h-[2px]" [style.height.%]="bar.heightPercent" [style.background]="color"></div>
        <span class="mt-2 text-[10px] font-semibold text-slate-400 w-full text-center truncate" [title]="bar.label">{{ bar.label }}</span>
      </div>
    </div>
  `
})
export class BarChartComponent {
  @Input() set data(value: BarChartItem[] | null | undefined) {
    this.bars = value || [];
  }

  @Input() color = '#3b82f6';
  @Input() unit = '';
  @Input() decimals = 0;
  @Input() height = 224;
  @Input() minBarWidth = 32;

  bars: BarChartItem[] = [];

  get decimalsFormat(): string {
    return `1.${this.decimals}-${this.decimals}`;
  }

  get renderBars(): BarChartRenderItem[] {
    const max = Math.max(...this.bars.map((bar) => bar.value), 1);
    return this.bars.map((bar) => ({ ...bar, heightPercent: (bar.value / max) * 100 }));
  }
}
