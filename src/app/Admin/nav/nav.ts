import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Rest } from '../../Core/Services/rest';
import { Shared } from '../../Core/Services/shared';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  private readonly rest = inject(Rest);
  private readonly router = inject(Router);
  private readonly sharedService = inject(Shared);

  protected readonly links = [
    { label: 'Hero & About', path: '/admin/about', icon: 'pi pi-user' },
    { label: 'Projects', path: '/admin/projects', icon: 'pi pi-th-large' },
    { label: 'Experience', path: '/admin/experience', icon: 'pi pi-briefcase' },
    { label: 'Skills', path: '/admin/skills', icon: 'pi pi-list' },
  ];

  confirmLogout(): void {
    this.sharedService.closeDialogConfirmation(
      'LogOut Confirmation',
      'Are you sure you want to log out?',
      'pi pi-sign-out',
      'Logout',
      () => this.logout(),
      'warn',
    );
  }

  async logout(): Promise<void> {
    try {
      await this.rest.logOut();
      localStorage.removeItem('isLoggedIn');
      this.sharedService.toaster('success', 'Success', 'You have been logged out.');
      this.router.navigate(['/login']);
    } catch (err) {
      console.error(err);
      this.sharedService.toaster('error', 'Error', 'Could not log out. Please try again.');
    }
  }
}
