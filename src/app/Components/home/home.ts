import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { HeroModel } from '../../Core/Models/Hero';
import { AboutModel } from '../../Core/Models/About';
import { ProjectsModel } from '../../Core/Models/Projects';
import { SkillsModel } from '../../Core/Models/Skills';
import { downloadResume as saveResumeFile, isPdfDataUrl } from '../../Core/Services/Resume';

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
  FeaturedProjects = signal<ProjectsModel[]>([]);
  FeaturedSkills = signal<SkillsModel[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadHomeData();
  }

  private async loadHomeData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [heroSnap, aboutSnap, projSnap, skillsSnap] = await Promise.all([
        this.restService.getHero(),
        this.restService.getAbout(),
        this.restService.getProjects(),
        this.restService.getSkills(),
      ]);

      const heroVal = heroSnap.val() as Record<string, HeroModel> | null;
      const hero = Object.values(heroVal ?? {})[0] ?? null;
      this.HeroData.set(hero);

      const aboutVal = aboutSnap.val() as Record<string, AboutModel> | null;
      const about = Object.values(aboutVal ?? {})[0] ?? null;
      this.AboutData.set(about);

      const projVal = projSnap.val() as Record<string, ProjectsModel> | null;
      const projects = Object.entries(projVal ?? {}).map(([id, p]) => ({ ...p, id }));
      this.FeaturedProjects.set(projects.slice(0, 3));

      const skillsVal = skillsSnap.val() as Record<string, SkillsModel> | null;
      const skills = Object.entries(skillsVal ?? {}).map(([id, s]) => ({ ...s, id }));
      this.FeaturedSkills.set(skills);
    } catch (err) {
      console.error('Error loading home data:', err);
      this.sharedService.toaster('error', 'Error', 'Could not load some homepage content.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected downloadResume(): void {
    const resume = this.HeroData()?.resume;
    if (!isPdfDataUrl(resume) || !saveResumeFile(resume, 'Jawad-Resume.pdf')) {
      this.sharedService.toaster('error', 'Error', 'The resume is not available right now.');
    }
  }

  protected getTechList(techString?: string): string[] {
    if (!techString) return [];
    return techString.split(',').map((t) => t.trim()).filter(Boolean);
  }

  protected getCoverImage(project: ProjectsModel): string | null {
    if (project.images && project.images.length > 0) {
      return project.images[0];
    }
    return project.image ?? null;
  }
}
