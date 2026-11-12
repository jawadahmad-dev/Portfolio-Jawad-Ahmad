import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ProjectsModel } from '../../Core/Models/Projects';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import { compressImage, dataUrlBytes } from '../../Core/Services/Image';

/** Only http(s) links are accepted. An empty value passes, so optional fields stay optional. */
const URL_PATTERN = /^https?:\/\/\S+$/i;

const MAX_IMAGES = 6;
/** All images of one project together (after resizing). */
const MAX_TOTAL_BYTES = 1024 * 1024;

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

  protected readonly maxImages = MAX_IMAGES;
  protected readonly projects = signal<ProjectsModel[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly processing = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  // Images currently in the form, and project cards whose cover failed to load
  protected readonly formImages = signal<string[]>([]);
  protected readonly brokenImages = signal<ReadonlySet<string>>(new Set());
  protected readonly totalKb = computed(() =>
    Math.round(this.totalBytes(this.formImages()) / 1024),
  );

  ngOnInit(): void {
    this.initProjectsForm();
    this.loadProjects();
  }

  initProjectsForm() {
    this.projectsForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      images: [[] as string[], Validators.required],
      liveLink: ['', Validators.pattern(URL_PATTERN)],
      githubLink: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
      technologies: ['', Validators.required],
    });

    this.projectsForm.get('images')!.valueChanges.subscribe((value: string[] | null) => {
      this.formImages.set(value ?? []);
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

  /** Images of a project. Projects saved before multi-image support only have a single link. */
  protected imagesOf(p: ProjectsModel): string[] {
    return p.images?.length ? p.images : p.image ? [p.image] : [];
  }

  protected cover(p: ProjectsModel): string {
    return this.imagesOf(p)[0] ?? '';
  }

  protected isBroken(id: string | undefined): boolean {
    return !!id && this.brokenImages().has(id);
  }

  protected markBroken(id: string | undefined): void {
    if (!id) return;
    this.brokenImages.update((set) => new Set(set).add(id));
  }

  private totalBytes(images: string[]): number {
    return images.reduce((sum, img) => sum + dataUrlBytes(img), 0);
  }

  private setImages(images: string[]): void {
    const control = this.projectsForm.get('images')!;
    control.setValue(images);
    control.markAsDirty();
    control.markAsTouched();
  }

  protected async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // lets the same file be chosen again
    if (!files.length) return;

    const room = MAX_IMAGES - this.formImages().length;
    if (room <= 0) {
      this.sharedService.toaster('error', 'Error', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    if (files.length > room) {
      this.sharedService.toaster(
        'error',
        'Error',
        `Only the first ${room} images were added (limit is ${MAX_IMAGES}).`,
      );
    }

    this.processing.set(true);
    const added: string[] = [];
    try {
      for (const file of files.slice(0, room)) {
        if (!file.type.startsWith('image/')) {
          this.sharedService.toaster('error', 'Error', `${file.name} is not an image.`);
          continue;
        }
        try {
          added.push(await compressImage(file));
        } catch (err) {
          console.error(err);
          this.sharedService.toaster('error', 'Error', `Could not read ${file.name}.`);
        }
      }
    } finally {
      this.processing.set(false);
    }

    if (!added.length) return;

    const next = [...this.formImages(), ...added];
    if (this.totalBytes(next) > MAX_TOTAL_BYTES) {
      this.sharedService.toaster(
        'error',
        'Error',
        'These images are too large together (limit is about 1 MB). Remove one or choose smaller screenshots.',
      );
      return;
    }
    this.setImages(next);
  }

  protected removeImage(index: number): void {
    this.setImages(this.formImages().filter((_, i) => i !== index));
  }

  protected makeCover(index: number): void {
    const images = this.formImages();
    this.setImages([images[index], ...images.filter((_, i) => i !== index)]);
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
      images: this.imagesOf(project),
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
      images: [],
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
      images: v.images,
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
