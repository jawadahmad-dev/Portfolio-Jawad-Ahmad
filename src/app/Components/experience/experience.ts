import { Component, inject, OnInit, signal } from '@angular/core';
import { ExperianceModel } from '../../Core/Models/Experiance';
import { Shared } from '../../Core/Services/shared';
import { Rest } from '../../Core/Services/rest';

@Component({
  selector: 'app-experience',
  imports: [],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);
  experiences = signal<ExperianceModel[]>([]);

  ngOnInit(): void {
    this.loadExperiences();
  }

  async loadExperiences(): Promise<void> {
    try {
      const snapshot = await this.restService.getExperiences();
      const value = snapshot.val() as Record<string, ExperianceModel> | null;
      const items = Object.entries(value ?? {})
        .map(([id, item]) => ({ ...item, id }))
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
      console.log('Loaded experiences:', items);
      this.experiences.set(items);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load your experience.');
    }
  }
}
