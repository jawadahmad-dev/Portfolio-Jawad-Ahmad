import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ProjectsModel } from '../../Core/Models/Projects';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';

/** Only http(s) links are accepted. An empty value passes, so optional fields stay optional. */
const URL_PATTERN = /^https?:\/\/\S+$/i;

@Component({
  selector: 'app-projects',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, TagModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements OnInit {
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);
  private readonly fb = inject(FormBuilder);

  projectsForm!: FormGroup;

  protected readonly projects = signal<ProjectsModel[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  // Image preview in the form, and cards whose image failed to load
  protected readonly previewUrl = signal('');
  protected readonly previewFailed = signal(false);
  protected readonly brokenImages = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.initProjectsForm();
    this.loadProjects();
  }

  initProjectsForm() {
    this.projectsForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      image: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
      liveLink: ['', Validators.pattern(URL_PATTERN)],
      githubLink: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
      technologies: ['', Validators.required],
    });

    this.projectsForm.get('image')!.valueChanges.subscribe((value: string | null) => {
      const url = (value ?? '').trim();
      this.previewFailed.set(false);
      this.previewUrl.set(URL_PATTERN.test(url) ? url : '');
    });
  }

  protected isInvalid(name: string): boolean {
    const c = this.projectsForm.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected techList(p: ProjectsModel): string[] {
    return (p.technologies ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  protected isBroken(id: string | undefined): boolean {
    return !!id && this.brokenImages().has(id);
  }

  protected markBroken(id: string | undefined): void {
    if (!id) return;
    this.brokenImages.update((set) => new Set(set).add(id));
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const snapshot = await this.restService.getProjects();
      const value = snapshot.val() as Record<string, ProjectsModel> | null;
      // Database keys are in the order the projects were added, so reverse for newest first
      const items = Object.entries(value ?? {})
        .map(([id, item]) => ({ ...item, id }))
        .reverse();
      this.brokenImages.set(new Set());
      this.projects.set(items);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load your projects.');
    } finally {
      this.loading.set(false);
    }
  }

  editProject(project: ProjectsModel): void {
    this.deletingId.set(null);
    this.editingId.set(project.id ?? null);
    this.projectsForm.reset({
      title: project.title,
      description: project.description,
      image: project.image,
      liveLink: project.liveLink ?? '',
      githubLink: project.githubLink,
      technologies: project.technologies,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.projectsForm.reset({
      title: '',
      description: '',
      image: '',
      liveLink: '',
      githubLink: '',
      technologies: '',
    });
  }

  async onSubmit(): Promise<void> {
    if (this.projectsForm.invalid) {
      this.projectsForm.markAllAsTouched();
      this.sharedService.toaster('error', 'Error', 'Please fix the highlighted fields.');
      return;
    }

    const v = this.projectsForm.getRawValue();
    const payload: ProjectsModel = {
      title: v.title.trim(),
      description: v.description.trim(),
      image: v.image.trim(),
      liveLink: v.liveLink.trim(),
      githubLink: v.githubLink.trim(),
      // "angular,  .NET" -> "angular, .NET"
      technologies: v.technologies
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
        .join(', '),
    };

    this.saving.set(true);
    try {
      await this.restService.saveProjects(payload, this.editingId() ?? undefined);
      this.sharedService.toaster('success', 'Saved', 'Project saved.');
      this.resetForm();
      await this.loadProjects();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not save this project.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(project: ProjectsModel): Promise<void> {
    try {
      await this.restService.deleteProjects(project.id!);
      this.sharedService.toaster('success', 'Deleted', 'Project deleted.');
      if (this.editingId() === project.id) this.resetForm();
      this.deletingId.set(null);
      await this.loadProjects();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not delete this project.');
    }
  }
}