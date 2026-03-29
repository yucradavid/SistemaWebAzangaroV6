import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setting-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col items-center justify-center text-center transition-all hover:border-[#0E3A8A]/20 hover:shadow-[0_4px_12px_-2px_rgba(6,81,237,0.15)] cursor-default min-w-[110px] sm:min-w-[130px] flex-1">
      <span class="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">{{ label }}</span>
      <span class="text-xl font-bold text-[#0E3A8A] leading-none">{{ value }}</span>
    </div>
  `
})
export class SettingMetricCardComponent {
  @Input() label: string = '';
  @Input() value: any = '';
}
