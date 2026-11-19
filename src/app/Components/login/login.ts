import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Shared } from '../../Core/Services/shared';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Rest } from '../../Core/Services/rest';
import { User } from '../../Core/Models/user';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private restService = inject(Rest);
  protected sharedService = inject(Shared);

  protected isSubmitting = signal(false);
  signInForm!: FormGroup;

  get emailControl(): AbstractControl | null {
    return this.signInForm?.get('email') ?? null;
  }

  get passwordControl(): AbstractControl | null {
    return this.signInForm?.get('password') ?? null;
  }

  ngOnInit(): void {
    this.formInit();
    console.log('pass Hash:', this.sharedService.EnCrypt('Nordic@321'));
  }

  formInit() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    this.signInForm.markAllAsTouched();
    if (this.signInForm.invalid) {
      this.sharedService.toaster('error', 'Error', 'Please enter both your email and password.');
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.signInForm.value;

    this.restService
      .getUsers()
      .then(async (snapshot) => {
        console.log('users:', snapshot.val());
        const usersObj = snapshot.val() as Record<string, User> | null;
        const match = Object.values(usersObj ?? {}).find(
          (u) => u.email === email && this.sharedService.DeCrypt(u.password) === password,
        );

        if (!match) {
          this.sharedService.toaster('error', 'Auth Error', 'Invalid Credentials');
          return;
        }

        await this.restService.Login({ email: match.email, loggedIn: true });
        localStorage.setItem('isLoggedIn', 'true');
        this.sharedService.toaster('success', 'Success', 'Login successful');
        this.router.navigate(['/admin']);
      })
      .catch((err) => {
        console.error(err);
        this.sharedService.toaster('error', 'Error', 'Something went wrong. Please try again.');
      })
      .finally(() => this.isSubmitting.set(false));
  }
}
