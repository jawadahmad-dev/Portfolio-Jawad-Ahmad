import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { HeroModel } from '../../Core/Models/Hero';
import { downloadResume as saveResumeFile, isPdfDataUrl } from '../../Core/Services/Resume';
import { AboutModel } from '../../Core/Models/About';

interface Project {
  name: string;
  note: string;
  tag: string;
  icon: string;
}

interface Offer {
  title: string;
  text: string;
  icon: string;
}

interface StackGroup {
  label: string;
  items: string[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  HeroData = signal<HeroModel | null>(null);
  AboutData = signal<AboutModel | null>(null);

  ngOnInit(): void {
    this.GetHero();
    this.GetAbout();
  }

  async GetHero(): Promise<void> {
    try {
      const snapshot = await this.restService.getHero();
      const value = snapshot.val() as Record<string, HeroModel> | null;
      const hero = Object.values(value ?? {})[0] ?? null;
      this.HeroData.set(hero);
      console.log('Hero data loaded:', hero);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load the hero section.');
    }
  }

  protected downloadResume(): void {
    const resume = this.HeroData()?.resume;
    if (!isPdfDataUrl(resume) || !saveResumeFile(resume, 'Jawad-Resume.pdf')) {
      this.sharedService.toaster('error', 'Error', 'The resume is not available right now.');
    }
  }

  private async GetAbout(): Promise<void> {
    try {
      const snapshot = await this.restService.getAbout();
      const value = snapshot.val() as Record<string, AboutModel> | null;
      const about = Object.values(value ?? {})[0] ?? null;
      this.AboutData.set(about);
      console.log('About data loaded:', about);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load the about section.');
    }
  }
}
