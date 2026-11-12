import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { AboutModel } from '../../Core/Models/About';
import { HeroModel } from '../../Core/Models/Hero';
import { SkillsModel } from '../../Core/Models/Skills';
import { downloadResume as saveResumeFile, isPdfDataUrl } from '../../Core/Services/Resume';

@Component({
  selector: 'app-about',
  imports: [RouterLink, ButtonModule, TagModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  protected readonly about = signal<AboutModel | null>(null);
  protected readonly hero = signal<HeroModel | null>(null);
  protected readonly skills = signal<SkillsModel[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.loadAboutData();
  }

  private async loadAboutData(): Promise<void> {
    this.loading.set(true);
    try {
      const [aboutSnap, heroSnap, skillsSnap] = await Promise.all([
        this.restService.getAbout(),
        this.restService.getHero(),
        this.restService.getSkills(),
      ]);

      const aboutVal = aboutSnap.val() as Record<string, AboutModel> | null;
      this.about.set(Object.values(aboutVal ?? {})[0] ?? null);

      const heroVal = heroSnap.val() as Record<string, HeroModel> | null;
      this.hero.set(Object.values(heroVal ?? {})[0] ?? null);

      const skillsVal = skillsSnap.val() as Record<string, SkillsModel> | null;
      this.skills.set(Object.entries(skillsVal ?? {}).map(([id, s]) => ({ ...s, id })));
    } catch (err) {
      console.error('Error loading about data:', err);
      this.sharedService.toaster('error', 'Error', 'Could not load profile details.');
    } finally {
      this.loading.set(false);
    }
  }

  protected downloadResume(): void {
    const resume = this.hero()?.resume;
    if (!isPdfDataUrl(resume) || !saveResumeFile(resume, 'Jawad-Resume.pdf')) {
      this.sharedService.toaster('error', 'Error', 'Resume is currently unavailable.');
    }
  }
}
