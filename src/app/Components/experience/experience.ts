import { Component, inject, OnInit, signal } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ExperianceModel } from '../../Core/Models/Experiance';
import { Shared } from '../../Core/Services/shared';
import { Rest } from '../../Core/Services/rest';

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
  imports: [TagModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);
  experiences = signal<ExperianceModel[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.loadExperiences();
  }

  async loadExperiences(): Promise<void> {
    try {
      const snapshot = await this.restService.getExperiences();
      const value = snapshot.val() as Record<string, ExperianceModel> | null;
      const items = Object.entries(value ?? {})
        .map(([id, item]) => ({ ...item, id }))
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')); // newest first
      this.experiences.set(items);
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
    return `${formatMonth(e.startDate)} to ${e.endDate ? formatMonth(e.endDate) : 'Present'}`;
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
}
