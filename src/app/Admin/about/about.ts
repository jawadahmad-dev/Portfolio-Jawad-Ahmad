import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AboutModel } from '../../Core/Models/About';
import { HeroModel } from '../../Core/Models/Hero';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';

/** Only http(s) links are accepted. */
const URL_PATTERN = /^https?:\/\/\S+$/i;

/** Each section is stored as a single record, so take the first entry of the collection. */
const firstEntry = <T>(value: Record<string, T> | null): [string, T] | null => {
  const entries = Object.entries(value ?? {});
  return entries.length ? entries[0] : null;
};

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
  protected readonly heroPreviewUrl = signal('');
  protected readonly heroPreviewFailed = signal(false);

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
    });
  }

  initHeroSectionForm() {
    this.HeroSectionForm = this.fb.group({
      title: ['', Validators.required],
      subtitle: ['', Validators.required],
      description: ['', Validators.required],
      resume: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
      image: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
    });

    this.HeroSectionForm.get('image')!.valueChanges.subscribe((value: string | null) => {
      const url = (value ?? '').trim();
      this.heroPreviewFailed.set(false);
      this.heroPreviewUrl.set(URL_PATTERN.test(url) ? url : '');
    });
  }

  protected isInvalid(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && c.touched;
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
        this.Aboutform.reset({ details: about[1].details });
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
          image: h.image,
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

    const payload: AboutModel = { details: this.Aboutform.getRawValue().details.trim() };

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
      image: v.image.trim(),
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
