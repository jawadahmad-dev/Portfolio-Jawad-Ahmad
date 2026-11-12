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
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AboutModel } from '../../Core/Models/About';
import { HeroModel } from '../../Core/Models/Hero';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';
import {
  MAX_RESUME_BYTES,
  downloadResume,
  isPdfDataUrl,
  readFileAsDataUrl,
} from '../../Core/Services/Resume';
import { compressImage, dataUrlBytes } from '../../Core/Services/Image';

/** The hero image is resized first, so it should stay well below this. */
const MAX_HERO_IMAGE_BYTES = 500 * 1024;

/** The resume must be a base64 PDF data URL (set by the file upload, not typed). */
const pdfDataUrl = (control: AbstractControl): ValidationErrors | null =>
  !control.value || isPdfDataUrl(control.value) ? null : { pdf: true };

/** Each section is stored as a single record, so take the first entry of the collection. */
const firstEntry = <T>(value: Record<string, T> | null): [string, T] | null => {
  const entries = Object.entries(value ?? {});
  return entries.length ? entries[0] : null;
};
const URL_PATTERN = /^https?:\/\/\S+$/i;

@Component({
  selector: 'app-about',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);
  private readonly fb = inject(FormBuilder);

  Aboutform!: FormGroup;
  HeroSectionForm!: FormGroup;

  protected readonly loading = signal(true);
  protected readonly savingAbout = signal(false);
  protected readonly savingHero = signal(false);
  protected readonly heroImage = signal('');
  protected readonly heroImageFailed = signal(false);
  protected readonly processingImage = signal(false);
  protected readonly imageSizeKb = signal(0);
  protected readonly resumeSizeKb = signal(0);

  // Database keys of the saved records, so Update overwrites them instead of adding new ones
  private aboutId: string | null = null;
  private heroId: string | null = null;

  ngOnInit(): void {
    this.initAboutForm();
    this.initHeroSectionForm();
    this.loadContent();
  }

  initAboutForm() {
    this.Aboutform = this.fb.group({
      details: ['', Validators.required],
      githubLink: ['', Validators.pattern(URL_PATTERN)],
      linkedinLink: ['', Validators.pattern(URL_PATTERN)],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  initHeroSectionForm() {
    this.HeroSectionForm = this.fb.group({
      title: ['', Validators.required],
      subtitle: ['', Validators.required],
      description: ['', Validators.required],
      resume: ['', [Validators.required, pdfDataUrl]],
      image: [''],
    });

    this.HeroSectionForm.get('image')!.valueChanges.subscribe((value: string | null) => {
      const image = value ?? '';
      this.heroImageFailed.set(false);
      this.heroImage.set(image);
      this.imageSizeKb.set(Math.round(dataUrlBytes(image) / 1024));
    });

    // Size of the stored PDF (base64 text is about 4/3 of the file size)
    this.HeroSectionForm.get('resume')!.valueChanges.subscribe((value: string | null) => {
      const text = value ?? '';
      this.resumeSizeKb.set(
        isPdfDataUrl(text) ? Math.round(((text.length - text.indexOf(',') - 1) * 3) / 4 / 1024) : 0,
      );
    });
  }

  protected isInvalid(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected async onResumeSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be chosen again
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.sharedService.toaster('error', 'Error', 'Please choose a PDF file.');
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      this.sharedService.toaster('error', 'Error', 'The PDF must be smaller than 1 MB.');
      return;
    }

    try {
      const control = this.HeroSectionForm.get('resume')!;
      control.setValue(await readFileAsDataUrl(file));
      control.markAsDirty();
      control.markAsTouched();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not read that file.');
    }
  }

  protected async onHeroImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be chosen again
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.sharedService.toaster('error', 'Error', 'Please choose an image file.');
      return;
    }

    this.processingImage.set(true);
    try {
      const dataUrl = await compressImage(file);
      if (dataUrlBytes(dataUrl) > MAX_HERO_IMAGE_BYTES) {
        this.sharedService.toaster(
          'error',
          'Error',
          'This image is still too large after resizing. Try a simpler one.',
        );
        return;
      }
      const control = this.HeroSectionForm.get('image')!;
      control.setValue(dataUrl);
      control.markAsDirty();
      control.markAsTouched();
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', `Could not read ${file.name}.`);
    } finally {
      this.processingImage.set(false);
    }
  }

  protected removeHeroImage(): void {
    const control = this.HeroSectionForm.get('image')!;
    control.setValue('');
    control.markAsDirty();
    control.markAsTouched();
  }

  /** Downloads the stored PDF so you can check it before or after saving. */
  protected checkResume(): void {
    const resume = this.HeroSectionForm.get('resume')?.value as string;
    if (!downloadResume(resume, 'resume.pdf')) {
      this.sharedService.toaster('error', 'Error', 'The stored resume is not a valid PDF.');
    }
  }

  private async loadContent(): Promise<void> {
    try {
      const [aboutSnap, heroSnap] = await Promise.all([
        this.restService.getAbout(),
        this.restService.getHero(),
      ]);

      const about = firstEntry(aboutSnap.val() as Record<string, AboutModel> | null);
      if (about) {
        this.aboutId = about[0];
        const a = about[1];
        this.Aboutform.reset({
          details: a.details,
          githubLink: a.githubLink ?? '',
          linkedinLink: a.linkedinLink ?? '',
          email: a.email ?? '',
        });
      }

      const hero = firstEntry(heroSnap.val() as Record<string, HeroModel> | null);
      if (hero) {
        this.heroId = hero[0];
        const h = hero[1];
        this.HeroSectionForm.reset({
          title: h.title,
          subtitle: h.subtitle,
          description: h.description,
          resume: h.resume,
          image: h.image ?? '',
        });
      }
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not load your hero and about content.');
    } finally {
      this.loading.set(false);
    }
  }

  async onAboutSubmit(): Promise<void> {
    if (this.Aboutform.invalid) {
      this.Aboutform.markAllAsTouched();
      this.sharedService.toaster('error', 'Error', 'Please write your about details.');
      return;
    }

    const v = this.Aboutform.getRawValue();
    const payload: AboutModel = {
      details: v.details.trim(),
      githubLink: (v.githubLink ?? '').trim(),
      linkedinLink: (v.linkedinLink ?? '').trim(),
      email: v.email.trim(),
    };

    this.savingAbout.set(true);
    try {
      await this.restService.saveAbout(payload, this.aboutId ?? undefined);
      this.sharedService.toaster('success', 'Saved', 'About section updated.');
      await this.loadContent(); // picks up the key of a newly created record
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not save the about section.');
    } finally {
      this.savingAbout.set(false);
    }
  }

  async onHeroSectionSubmit(): Promise<void> {
    if (this.HeroSectionForm.invalid) {
      this.HeroSectionForm.markAllAsTouched();
      this.sharedService.toaster('error', 'Error', 'Please fix the highlighted fields.');
      return;
    }

    const v = this.HeroSectionForm.getRawValue();
    const payload: HeroModel = {
      title: v.title.trim(),
      subtitle: v.subtitle.trim(),
      description: v.description.trim(),
      resume: v.resume.trim(),
      image: (v.image ?? '').trim(),
    };

    this.savingHero.set(true);
    try {
      await this.restService.saveHero(payload, this.heroId ?? undefined);
      this.sharedService.toaster('success', 'Saved', 'Hero section updated.');
      await this.loadContent(); // picks up the key of a newly created record
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not save the hero section.');
    } finally {
      this.savingHero.set(false);
    }
  }
}
