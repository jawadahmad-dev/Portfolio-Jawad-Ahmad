import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="theme.toggle()"
      [attr.aria-label]="
        theme.resolved() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      "
      [attr.aria-pressed]="theme.resolved() === 'dark'"
      title="Theme: {{ theme.preference() }}"
    >
      <span
        class="theme-toggle__icon"
        [class.theme-toggle__icon--light]="theme.resolved() === 'light'"
        aria-hidden="true"
      >
        @if (theme.resolved() === 'dark') {
          <i class="pi pi-sun"></i>
        } @else {
          <i class="pi pi-moon"></i>
        }
      </span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .theme-toggle {
      width: 2.75rem;
      height: 2.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      //   border: 1px solid var(--border);
      //   border-radius: 9999px;
      //   background: var(--bg-elevated);
      color: var(--text);
      //   box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition:
        transform 220ms ease,
        color 220ms ease,
        border-color 220ms ease;
    }
    .theme-toggle:hover {
      border-color: var(--primary);
      color: var(--primary);
      transform: translateY(-1px);
    }
    .theme-toggle__icon {
      display: grid;
      place-items: center;
      transition:
        transform 220ms ease,
        opacity 220ms ease;
    }
    .theme-toggle__icon--light {
      transform: rotate(180deg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
}
