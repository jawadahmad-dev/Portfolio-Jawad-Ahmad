import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface NavLink {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, ButtonModule, RouterOutlet],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  // Change the paths to match your app.routes.ts.
  // Contact is the call-to-action button, so it is not in this list.
  protected readonly links: NavLink[] = [
    { label: 'Home', path: '/', icon: 'pi pi-home', exact: true },
    { label: 'About', path: '/about', icon: 'pi pi-user' },
    { label: 'Experience', path: '/experience', icon: 'pi pi-briefcase' },
    { label: 'Projects', path: '/projects', icon: 'pi pi-th-large' },
  ];

  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}