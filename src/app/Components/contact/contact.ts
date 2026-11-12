import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AboutModel } from '../../Core/Models/About';
import { ContactModel, Web3FormsResponse } from '../../Core/Models/Contact';
import { Shared } from '../../Core/Services/shared';
import { Rest } from '../../Core/Services/rest';

/** Web3Forms access keys are meant to be public. Restrict the key to your domain in the Web3Forms dashboard. */
const WEB3FORMS_ACCESS_KEY = '0bcb2d01-9d14-4e7c-a7b0-5f3f8b4a433f';

const MESSAGE_MAX = 2000;

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit {
  contactForm!: FormGroup;
  private readonly fb = inject(FormBuilder);
  private readonly sharedService = inject(Shared);
  private readonly restService = inject(Rest);

  protected readonly messageMax = MESSAGE_MAX;
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly about = signal<AboutModel | null>(null);

  ngOnInit(): void {
    this.initContactForm();
    this.loadAbout();
  }

  private initContactForm() {
    this.contactForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80),
          Validators.pattern(/\S/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
      message: [
        '',
        [Validators.required, Validators.maxLength(MESSAGE_MAX), Validators.pattern(/\S/)],
      ],
      botcheck: [false],
    });
  }

  /** Optional: shows your email and profile links next to the form. */
  private async loadAbout(): Promise<void> {
    try {
      const snapshot = await this.restService.getAbout();
      const value = snapshot.val() as Record<string, AboutModel> | null;
      this.about.set(Object.values(value ?? {})[0] ?? null);
    } catch (err) {
      console.error(err); // not critical, the form still works
    }
  }

  protected isInvalid(name: string): boolean {
    const c = this.contactForm.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected get messageLength(): number {
    return (this.contactForm.get('message')?.value ?? '').length;
  }

  protected onSubmitContact() {
    if (this.sending()) return;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const v = this.contactForm.getRawValue();
    const payload: ContactModel = {
      access_key: WEB3FORMS_ACCESS_KEY,
      name: v.name.trim(),
      email: v.email.trim(),
      subject: v.subject.trim(),
      message: v.message.trim(),
      botcheck: !!v.botcheck,
    };

    this.sending.set(true);
    this.restService.sendContactForm(payload).subscribe({
      next: (res: Web3FormsResponse) => {
        this.sending.set(false);
        if (res.success) {
          this.contactForm.reset({
            name: '',
            email: '',
            subject: '',
            message: '',
            botcheck: false,
          });
          this.sent.set(true);
          return;
        }
        this.sharedService.toaster(
          'error',
          'Error',
          res.message || 'Your message could not be sent.',
        );
      },
      error: (err: unknown) => {
        this.sending.set(false);
        console.error('Web3Forms contact form error:', err);
        this.sharedService.toaster(
          'error',
          'Error',
          'Could not send your message. Please try again.',
        );
      },
    });
  }
}
