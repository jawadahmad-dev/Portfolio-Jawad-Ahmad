import {
  computed,
  effect,
  Inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  readonly preference = signal<ThemePreference>('system');
  readonly resolved = computed<ResolvedTheme>(() => {
    const pref = this.preference();
    if (pref !== 'system') return pref; // narrowed to 'light' | 'dark'
    return this.systemDark() ? 'dark' : 'light';
  });

  private readonly systemDark = signal(false);
  private mediaQuery: MediaQueryList | null = null;
  private readonly mediaListener = (event: MediaQueryListEvent) =>
    this.systemDark.set(event.matches);
  private hasAppliedTheme = false;
  private transitionTimer: number | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    if (!isPlatformBrowser(platformId)) return;

    try {
      const saved = localStorage.getItem('theme-preference');
      this.preference.set(
        saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system',
      );
    } catch {
      this.preference.set('system');
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemDark.set(this.mediaQuery.matches);
      this.mediaQuery.addEventListener?.('change', this.mediaListener);
    }

    effect(() => {
      const resolved = this.resolved();
      const root = document.documentElement;

      const applyTheme = () => {
        root.classList.toggle('dark', resolved === 'dark');
        root.style.colorScheme = resolved;

        const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        themeColor?.setAttribute('content', resolved === 'dark' ? '#061319' : '#eff7f6');
      };

      const reducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!this.hasAppliedTheme || reducedMotion) {
        applyTheme();
        this.hasAppliedTheme = true;
        return;
      }

      root.classList.add('theme-transition');

      type ViewTransitionDocument = Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> };
      };
      const transitionDocument = document as ViewTransitionDocument;

      if (typeof transitionDocument.startViewTransition === 'function') {
        void transitionDocument.startViewTransition(applyTheme).finished.finally(() => {
          root.classList.remove('theme-transition');
        });
      } else {
        applyTheme();
        if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer);
        this.transitionTimer = window.setTimeout(() => {
          root.classList.remove('theme-transition');
          this.transitionTimer = null;
        }, 260);
      }

      this.hasAppliedTheme = true;
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme-preference', preference);
      } catch {
        // Storage may be disabled; the in-memory choice still works.
      }
    }
  }

  toggle(): void {
    this.setPreference(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener?.('change', this.mediaListener);
  }
}
