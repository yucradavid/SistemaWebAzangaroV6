import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Check,
  Music,
  Palette,
  BookOpen,
  Puzzle,
  Trophy,
  Cpu
} from 'lucide-angular';
import { DataService } from '@core/services/data_general/data.service';
import { SeoService } from '@core/services/seo/seo.service';
import { PageHeroComponent } from '@shared/components/public/page-hero/page-hero.component';

type NivelId = 'inicial' | 'primaria' | 'secundaria';

/**
 * Página de nivel educativo (inicial / primaria / secundaria).
 * Un único componente data-driven: la ruta aporta `data.nivel`
 * y el contenido proviene de DataService.getLevelById().
 */
@Component({
  selector: 'app-level',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './level.component.html',
  styleUrl: './level.component.css'
})
export class LevelComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly seoService = inject(SeoService);

  /** Reacciona a cambios de ruta sin recrear el componente */
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data
  });

  readonly nivelId = computed(() => (this.routeData()['nivel'] ?? 'inicial') as NivelId);
  readonly level = computed(
    () => this.dataService.getLevelById(this.nivelId()) ?? this.dataService.levels()[0]
  );

  private static readonly WORKSHOP_ICONS = [Music, Palette, BookOpen, Puzzle, Trophy, Cpu];

  constructor() {
    effect(() => {
      const level = this.level();
      if (level) {
        this.seoService.updateTitle(`Nivel ${level.name} - CERMAT SCHOOL`);
      }
    });
  }

  workshopIcon(index: number) {
    return LevelComponent.WORKSHOP_ICONS[index % LevelComponent.WORKSHOP_ICONS.length];
  }

  formatIndex(index: number): string {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
  }

  readonly CheckIcon = Check;
}
