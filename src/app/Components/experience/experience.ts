import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ExperianceModel } from '../../Core/Models/Experiance';
import { HeroModel } from '../../Core/Models/Hero';
import { Shared } from '../../Core/Services/shared';
import { Rest } from '../../Core/Services/rest';
import { downloadResume as saveResumeFile, isPdfDataUrl } from '../../Core/Services/Resume';

/** "2024-03" -> total month number, so two dates can be subtracted */
const monthIndex = (value: string | undefined): number | null => {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  return Number.isFinite(year) && Number.isFinite(month) ? year * 12 + (month - 1) : null;
};

/** "2024-03" -> "Mar 2024" */
const formatMonth = (value: string | undefined): string => {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

@Component({
  selector: 'app-experience',
  imports: [ButtonModule, TagModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  experiences = signal<ExperianceModel[]>([]);
  hero = signal<HeroModel | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.loadExperiences();
  }

  async loadExperiences(): Promise<void> {
    this.loading.set(true);
    try {
      const [expSnap, heroSnap] = await Promise.all([
        this.restService.getExperiences(),
        this.restService.getHero(),
      ]);

      const value = expSnap.val() as Record<string, ExperianceModel> | null;
      const items = Object.entries(value ?? {})
        .map(([id, item]) => ({ ...item, id }))
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')); // newest first
      this.experiences.set(items);

      const heroVal = heroSnap.val() as Record<string, HeroModel> | null;
      this.hero.set(Object.values(heroVal ?? {})[0] ?? null);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load your experience.');
    } finally {
      this.loading.set(false);
    }
  }

  /** A role without an end date is the current one. */
  protected isCurrent(e: ExperianceModel): boolean {
    return !e.endDate;
  }

  protected period(e: ExperianceModel): string {
    return `${formatMonth(e.startDate)} - ${e.endDate ? formatMonth(e.endDate) : 'Present'}`;
  }

  /** "1 yr 4 mos", counting both the first and last month. */
  protected duration(e: ExperianceModel): string {
    const start = monthIndex(e.startDate);
    if (start === null) return '';

    const now = new Date();
    const end = monthIndex(e.endDate) ?? now.getFullYear() * 12 + now.getMonth();
    const total = Math.max(1, end - start + 1);
    const years = Math.floor(total / 12);
    const months = total % 12;

    const parts: string[] = [];
    if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (months) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
    return parts.join(' ');
  }

  protected descriptionBullets(description?: string): string[] {
    if (!description?.trim()) return [];
    return description
      .split(/(?:\r?\n|•)/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }

  protected techList(technologies?: string): string[] {
    if (!technologies?.trim()) return [];
    return technologies
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  protected downloadResume(): void {
    const resume = this.hero()?.resume;
    if (!isPdfDataUrl(resume) || !saveResumeFile(resume, 'Jawad-Resume.pdf')) {
      this.sharedService.toaster('error', 'Error', 'The resume is not available right now.');
    }
  }
}
