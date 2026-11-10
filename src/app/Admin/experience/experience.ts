import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ExperianceModel } from '../../Core/Models/Experiance';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';

/** Date -> "YYYY-MM" (the format stored in the database) */
const toMonth = (d: Date | null): string =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '';

/** "YYYY-MM" -> Date */
const fromMonth = (s: string): Date | null => {
  if (!s) return null;
  const [y, m] = s.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

/** The end date cannot be before the start date. */
const dateRange = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startDate')?.value as Date | null;
  const end = group.get('endDate')?.value as Date | null;
  return start && end && end < start ? { dateRange: true } : null;
};

@Component({
  selector: 'app-experience',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
  ],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience implements OnInit {
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);
  private readonly fb = inject(FormBuilder);

  experienceForm!: FormGroup;

  protected readonly experiences = signal<ExperianceModel[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.initExperienceForm();
    this.loadExperiences();
  }

  initExperienceForm() {
    this.experienceForm = this.fb.group(
      {
        jobTitle: ['', Validators.required],
        company: ['', Validators.required],
        startDate: [null as Date | null, Validators.required],
        endDate: [null as Date | null],
        currentlyWorking: [false],
        description: ['', Validators.required],
      },
      { validators: dateRange },
    );

    // A current job has no end date
    this.experienceForm.get('currentlyWorking')!.valueChanges.subscribe((current: boolean) => {
      const end = this.experienceForm.get('endDate')!;
      if (current) {
        end.reset(null);
        end.disable();
      } else {
        end.enable();
      }
    });
  }

  protected isInvalid(name: string): boolean {
    const c = this.experienceForm.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected period(e: ExperianceModel): string {
    const fmt = (s: string) =>
      fromMonth(s)!.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${e.startDate ? fmt(e.startDate) : ''} to ${e.endDate ? fmt(e.endDate) : 'Present'}`;
  }

  async loadExperiences(): Promise<void> {
    this.loading.set(true);
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

  editExperience(item: ExperianceModel): void {
    this.deletingId.set(null);
    this.editingId.set(item.id ?? null);
    this.experienceForm.reset({
      jobTitle: item.jobTitle,
      company: item.company,
      startDate: fromMonth(item.startDate),
      endDate: fromMonth(item.endDate),
      currentlyWorking: !item.endDate,
      description: item.description,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.experienceForm.reset({
      jobTitle: '',
      company: '',
      startDate: null,
      endDate: null,
      currentlyWorking: false,
      description: '',
    });
  }

  async onSubmit(): Promise<void> {
    if (this.experienceForm.invalid) {
      this.experienceForm.markAllAsTouched();
      this.sharedService.toaster('error', 'Error', 'Please fix the highlighted fields.');
      return;
    }

    const v = this.experienceForm.getRawValue();
    const payload: ExperianceModel = {
      jobTitle: v.jobTitle.trim(),
      company: v.company.trim(),
      startDate: toMonth(v.startDate),
      endDate: v.currentlyWorking ? '' : toMonth(v.endDate),
      description: v.description.trim(),
    };

    this.saving.set(true);
    try {
      await this.restService.saveExperience(payload, this.editingId() ?? undefined);
      this.sharedService.toaster('success', 'Saved', 'Experience saved.');
      this.resetForm();
      await this.loadExperiences();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not save this entry.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(item: ExperianceModel): Promise<void> {
    try {
      await this.restService.deleteExperience(item.id!);
      this.sharedService.toaster('success', 'Deleted', 'Entry deleted.');
      if (this.editingId() === item.id) this.resetForm();
      this.deletingId.set(null);
      await this.loadExperiences();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not delete this entry.');
    }
  }
}