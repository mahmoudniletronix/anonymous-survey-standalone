import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideIconData } from 'lucide-angular';

interface IconNodeViewModel {
  readonly id: number;
  readonly tag: string;
  readonly attrs: Record<string, string | number>;
}

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  readonly icon = input.required<LucideIconData>();
  readonly size = input(18);
  readonly strokeWidth = input(2);
  readonly decorative = input(true);

  readonly nodes = computed<readonly IconNodeViewModel[]>(() =>
    this.icon().map(([tag, attrs], index) => ({
      id: index,
      tag,
      attrs: attrs as Record<string, string | number>
    }))
  );
}
