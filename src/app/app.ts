import { AsyncPipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Shared } from './Core/Services/shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(window:scroll)': 'onScroll()' },
})
export class App implements OnInit {
  protected readonly title = signal('Portfolio');
  protected readonly scrollProgress = signal(0);
  protected readonly showBackToTop = signal(false);
  private readonly router = inject(Router);
  private readonly sharedService = inject(Shared);
  protected readonly isLoading$ = this.sharedService.$obsloading;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-theme');
      document.documentElement.dataset['theme'] = saved ?? 'dark';
      document.documentElement.classList.toggle('dark', (saved ?? 'dark') === 'dark');
      this.onScroll();
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.sharedService.setRouteLoading(true);
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.sharedService.setRouteLoading(false);
      }
    });
  }

  protected onScroll(): void {
    if (typeof window === 'undefined') return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress.set(height > 0 ? window.scrollY / height : 0);
    this.showBackToTop.set(window.scrollY > 520);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
