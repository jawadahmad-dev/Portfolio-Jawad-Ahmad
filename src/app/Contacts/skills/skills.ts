import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { SkillsModel } from '../../Core/Models/Skills';

interface CoreSkillCategory {
  title: string;
  icon: string;
  description: string;
  skills: { name: string; level: string; icon: string }[];
}

@Component({
  selector: 'app-skills',
  imports: [
    RouterLink,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skills implements OnInit {
  private readonly restService = inject(Rest);
  private readonly sharedService = inject(Shared);

  protected readonly customSkills = signal<SkillsModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchQuery = signal('');

  protected readonly coreCategories: CoreSkillCategory[] = [
    {
      title: 'Frontend Architecture',
      icon: 'pi pi-desktop',
      description: 'Modern, reactive client-side interfaces built for speed, accessibility, and scale.',
      skills: [
        { name: 'Angular 21', level: 'Expert', icon: 'pi pi-code' },
        { name: 'TypeScript', level: 'Advanced', icon: 'pi pi-code' },
        { name: 'TailwindCSS & SCSS', level: 'Expert', icon: 'pi pi-palette' },
        { name: 'PrimeNG 21', level: 'Advanced', icon: 'pi pi-th-large' },
        { name: 'Signals & State', level: 'Advanced', icon: 'pi pi-bolt' },
        { name: 'RxJS & Observables', level: 'Advanced', icon: 'pi pi-sync' },
      ],
    },
    {
      title: 'Backend & APIs',
      icon: 'pi pi-server',
      description: 'High-performance, secure backend services following Clean Architecture principles.',
      skills: [
        { name: 'C# & .NET 9', level: 'Advanced', icon: 'pi pi-cog' },
        { name: 'ASP.NET Core Web API', level: 'Advanced', icon: 'pi pi-server' },
        { name: 'Entity Framework Core', level: 'Advanced', icon: 'pi pi-database' },
        { name: 'RESTful Architecture', level: 'Expert', icon: 'pi pi-arrows-alt' },
        { name: 'Clean Architecture', level: 'Advanced', icon: 'pi pi-box' },
        { name: 'Authentication & JWT', level: 'Advanced', icon: 'pi pi-lock' },
      ],
    },
    {
      title: 'Databases & Cloud',
      icon: 'pi pi-database',
      description: 'Reliable data persistence, relational modeling, and realtime synchronization.',
      skills: [
        { name: 'PostgreSQL', level: 'Advanced', icon: 'pi pi-database' },
        { name: 'Firebase Realtime DB', level: 'Advanced', icon: 'pi pi-cloud' },
        { name: 'SQL Query Optimization', level: 'Intermediate', icon: 'pi pi-sliders-h' },
        { name: 'Cloud Deployments', level: 'Intermediate', icon: 'pi pi-cloud-upload' },
      ],
    },
    {
      title: 'Engineering & Workflow',
      icon: 'pi pi-shield',
      description: 'Professional development practices ensuring code quality and rapid delivery.',
      skills: [
        { name: 'Git & Version Control', level: 'Expert', icon: 'pi pi-github' },
        { name: 'WCAG AA Accessibility', level: 'Advanced', icon: 'pi pi-check-circle' },
        { name: 'Postman & API Testing', level: 'Advanced', icon: 'pi pi-send' },
        { name: 'Agile & Code Reviews', level: 'Advanced', icon: 'pi pi-users' },
      ],
    },
  ];

  // Filtered custom skills from Firebase
  protected readonly filteredCustomSkills = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.customSkills();
    return this.customSkills().filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  });

  ngOnInit(): void {
    this.loadSkills();
  }

  private async loadSkills(): Promise<void> {
    this.loading.set(true);
    try {
      const snap = await this.restService.getSkills();
      const val = snap.val() as Record<string, SkillsModel> | null;
      const list = Object.entries(val ?? {}).map(([id, s]) => ({ ...s, id }));
      this.customSkills.set(list);
    } catch (err) {
      console.error('Error loading skills:', err);
      this.sharedService.toaster('error', 'Error', 'Could not load skills list.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }
}
