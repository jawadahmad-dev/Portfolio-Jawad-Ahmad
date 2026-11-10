import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface Project {
  name: string;
  note: string;
  tag: string;
  icon: string;
}

interface Offer {
  title: string;
  text: string;
  icon: string;
}

interface StackGroup {
  label: string;
  items: string[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  // Replace the placeholder links with your own profiles.
  protected readonly socials = [
    { label: 'GitHub', icon: 'pi pi-github', href: 'https://github.com/' },
    { label: 'LinkedIn', icon: 'pi pi-linkedin', href: 'https://www.linkedin.com/' },
    { label: 'Email', icon: 'pi pi-envelope', href: 'mailto:jawad@example.com' },
  ];

  protected readonly projects: Project[] = [
    { name: 'SiteSync', note: 'Maps documents between ERPNext sites', tag: 'Admin app', icon: 'pi pi-sync' },
    { name: 'PharmaCare', note: 'Pharmacy dashboard with light and dark themes', tag: 'Dashboard', icon: 'pi pi-heart' },
    { name: 'Gate pass forms', note: 'Inward gate pass entry in right-to-left Urdu', tag: 'Forms', icon: 'pi pi-file-edit' },
  ];

  protected readonly offers: Offer[] = [
    { title: 'Admin dashboards', text: 'Tables, charts and filters that stay fast with real data.', icon: 'pi pi-chart-line' },
    { title: 'System integrations', text: 'Sync layers that move records between ERPNext sites and your own APIs.', icon: 'pi pi-sitemap' },
    { title: 'Forms for real workflows', text: 'Validated, accessible forms, including right-to-left layouts.', icon: 'pi pi-list-check' },
  ];

  protected readonly stack: StackGroup[] = [
    { label: 'Frontend', items: ['Angular', 'TypeScript', 'PrimeNG', 'Tailwind CSS', 'SCSS'] },
    { label: 'Backend', items: ['.NET', 'REST APIs', 'Firebase'] },
    { label: 'ERP', items: ['ERPNext', 'Frappe'] },
  ];
}