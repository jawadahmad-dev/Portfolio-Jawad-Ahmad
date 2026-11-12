import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { ProjectsModel } from '../../Core/Models/Projects';

@Component({
  selector: 'app-projects',
  imports: [
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  protected readonly projects = signal<ProjectsModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchQuery = signal('');
  protected readonly selectedTag = signal('ALL');

  // Gallery Dialog state
  protected readonly galleryVisible = signal(false);
  protected readonly activeProject = signal<ProjectsModel | null>(null);
  protected readonly activeImageIndex = signal(0);

  // Available filter tags computed from projects
  protected readonly availableTags = computed(() => {
    const set = new Set<string>();
    for (const p of this.projects()) {
      if (p.technologies) {
        p.technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => set.add(t));
      }
    }
    return ['ALL', ...Array.from(set)];
  });

  // Filtered projects
  protected readonly filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();

    return this.projects().filter((p) => {
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.technologies && p.technologies.toLowerCase().includes(query));

      const matchesTag =
        tag === 'ALL' ||
        (p.technologies &&
          p.technologies
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .includes(tag.toLowerCase()));

      return matchesQuery && matchesTag;
    });
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  private async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const snap = await this.restService.getProjects();
      const val = snap.val() as Record<string, ProjectsModel> | null;
      const list = Object.entries(val ?? {}).map(([id, p]) => ({ ...p, id }));
      this.projects.set(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
      this.sharedService.toaster('error', 'Error', 'Could not load projects catalog.');
    } finally {
      this.loading.set(false);
    }
  }

  protected getTechList(techString?: string): string[] {
    if (!techString) return [];
    return techString.split(',').map((t) => t.trim()).filter(Boolean);
  }

  protected getCoverImage(p: ProjectsModel): string | null {
    if (p.images && p.images.length > 0) return p.images[0];
    return p.image ?? null;
  }

  protected getAllImages(p: ProjectsModel): string[] {
    if (p.images && p.images.length > 0) return p.images;
    if (p.image) return [p.image];
    return [];
  }

  protected openGallery(project: ProjectsModel, index: number = 0): void {
    const images = this.getAllImages(project);
    if (images.length === 0) return;
    this.activeProject.set(project);
    this.activeImageIndex.set(index);
    this.galleryVisible.set(true);
  }

  protected nextImage(): void {
    const proj = this.activeProject();
    if (!proj) return;
    const images = this.getAllImages(proj);
    this.activeImageIndex.update((curr) => (curr + 1) % images.length);
  }

  protected prevImage(): void {
    const proj = this.activeProject();
    if (!proj) return;
    const images = this.getAllImages(proj);
    this.activeImageIndex.update((curr) => (curr - 1 + images.length) % images.length);
  }

  protected setTagFilter(tag: string): void {
    this.selectedTag.set(tag);
  }

  protected onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectedTag.set('ALL');
  }
}
