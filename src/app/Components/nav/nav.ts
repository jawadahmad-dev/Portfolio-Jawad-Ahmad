import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { AboutModel } from '../../Core/Models/About';
import { HeroModel } from '../../Core/Models/Hero';
import { downloadResume as saveResumeFile, isPdfDataUrl } from '../../Core/Services/Resume';

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
  host: {
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Nav implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  protected readonly links: NavLink[] = [
    { label: 'Home', path: '/', icon: 'pi pi-home', exact: true },
    { label: 'About', path: '/about', icon: 'pi pi-user' },
    { label: 'Skills', path: '/skills', icon: 'pi pi-bolt' },
    { label: 'Experience', path: '/experience', icon: 'pi pi-briefcase' },
    { label: 'Projects', path: '/projects', icon: 'pi pi-th-large' },
  ];

  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly aboutData = signal<AboutModel | null>(null);
  protected readonly heroData = signal<HeroModel | null>(null);
  protected readonly currentYear = 2026;

  ngOnInit(): void {
    this.loadNavData();
  }

  private async loadNavData(): Promise<void> {
    try {
      const [aboutSnap, heroSnap] = await Promise.all([
        this.restService.getAbout(),
        this.restService.getHero(),
      ]);
      const aboutVal = aboutSnap.val() as Record<string, AboutModel> | null;
      const heroVal = heroSnap.val() as Record<string, HeroModel> | null;
      this.aboutData.set(Object.values(aboutVal ?? {})[0] ?? null);
      this.heroData.set(Object.values(heroVal ?? {})[0] ?? null);
    } catch (err) {
      console.warn('Could not load navigation metadata:', err);
    }
  }

  onScroll(): void {
    if (typeof window !== 'undefined') {
      this.scrolled.set(window.scrollY > 12);
    }
  }

  onEscape(): void {
    this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  downloadResume(): void {
    const resume = this.heroData()?.resume;
    if (!isPdfDataUrl(resume) || !saveResumeFile(resume, 'Jawad-Resume.pdf')) {
      this.sharedService.toaster('warn', 'Notice', 'Resume file is not available right now.');
    }
  }
}
