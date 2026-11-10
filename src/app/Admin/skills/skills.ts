import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SkillsModel } from '../../Core/Models/Skills';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';

/** Only http(s) links are accepted. An empty value passes, so the icon stays optional. */
const URL_PATTERN = /^https?:\/\/\S+$/i;

@Component({
  selector: 'app-skills',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills implements OnInit {
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);
  private readonly fb = inject(FormBuilder);

  skillsForm!: FormGroup;

  protected readonly skills = signal<SkillsModel[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  // Icon preview in the form, and cards whose icon failed to load
  protected readonly previewUrl = signal('');
  protected readonly previewFailed = signal(false);
  protected readonly brokenIcons = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.initSkillsForm();
    this.loadSkills();
  }

  initSkillsForm() {
    this.skillsForm = this.fb.group({
      iconLink: ['', Validators.pattern(URL_PATTERN)],
      title: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.skillsForm.get('iconLink')!.valueChanges.subscribe((value: string | null) => {
      const url = (value ?? '').trim();
      this.previewFailed.set(false);
      this.previewUrl.set(URL_PATTERN.test(url) ? url : '');
    });
  }

  protected isInvalid(name: string): boolean {
    const c = this.skillsForm.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected isBroken(id: string | undefined): boolean {
    return !!id && this.brokenIcons().has(id);
  }

  protected markBroken(id: string | undefined): void {
    if (!id) return;
    this.brokenIcons.update((set) => new Set(set).add(id));
  }

  async loadSkills(): Promise<void> {
    this.loading.set(true);
    try {
      const snapshot = await this.restService.getSkills();
      const value = snapshot.val() as Record<string, SkillsModel> | null;
      // Database keys are in the order the skills were added, so reverse for newest first
      const items = Object.entries(value ?? {})
        .map(([id, item]) => ({ ...item, id }))
        .reverse();
      this.brokenIcons.set(new Set());
      this.skills.set(items);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load your skills.');
    } finally {
      this.loading.set(false);
    }
  }

  editSkill(skill: SkillsModel): void {
    this.deletingId.set(null);
    this.editingId.set(skill.id ?? null);
    this.skillsForm.reset({
      iconLink: skill.iconLink ?? '',
      title: skill.title,
      description: skill.description,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.skillsForm.reset({ iconLink: '', title: '', description: '' });
  }

  async onSubmit(): Promise<void> {
    if (this.skillsForm.invalid) {
      this.skillsForm.markAllAsTouched();
      this.sharedService.toaster('error', 'Error', 'Please fix the highlighted fields.');
      return;
    }

    const v = this.skillsForm.getRawValue();
    const payload: SkillsModel = {
      iconLink: v.iconLink.trim(),
      title: v.title.trim(),
      description: v.description.trim(),
    };

    this.saving.set(true);
    try {
      await this.restService.saveSkills(payload, this.editingId() ?? undefined);
      this.sharedService.toaster('success', 'Saved', 'Skill saved.');
      this.resetForm();
      await this.loadSkills();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not save this skill.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(skill: SkillsModel): Promise<void> {
    try {
      await this.restService.deleteSkills(skill.id!);
      this.sharedService.toaster('success', 'Deleted', 'Skill deleted.');
      if (this.editingId() === skill.id) this.resetForm();
      this.deletingId.set(null);
      await this.loadSkills();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not delete this skill.');
    }
  }
}