import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from './reveal.directive';

@Component({
  selector: 'app-section-header',
  imports: [Reveal],
  template: `
    <header class="section-header" appReveal>
      <p class="section-header__eyebrow">{{ eyebrow() }}</p>
      <h1 class="section-header__title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="section-header__subtitle">{{ subtitle() }}</p>
      }
      <span class="section-header__underline" aria-hidden="true"></span>
    </header>
  `,
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeader {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
