import { Routes } from '@angular/router';
import { mainGuard } from './Core/Guards/main-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./Components/nav/nav').then((m) => m.Nav),
    title: 'Home',
    children: [
      {
        path: '',
        loadComponent: () => import('./Components/home/home').then((m) => m.Home),
        title: 'Home',
      },
      {
        path: 'about',
        loadComponent: () => import('./Components/about/about').then((m) => m.About),
        title: 'About',
      },
      {
        path: 'contact',
        loadComponent: () => import('./Components/contact/contact').then((m) => m.Contact),
        title: 'Contact',
      },
      {
        path: "experience",
        loadComponent: () => import('./Components/experience/experience').then((m) => m.Experience),
        title: 'Experience',
      },
      {
        path: 'skills',
        loadComponent: () => import('./Contacts/skills/skills').then((m) => m.Skills),
        title: 'Skills',
      },
      {
        path: "projects",
        loadComponent: () => import('./Components/projects/projects').then((m) => m.Projects),
        title: 'Projects',
      }
  ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./Admin/nav/nav').then((m) => m.Nav),
    title: 'Admin',
    canActivate: [mainGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./Admin/about/about').then((m) => m.About),
        title: 'About',
      },
      {
        path: 'experience',
        loadComponent: () => import('./Admin/experience/experience').then((m) => m.Experience),
        title: 'Experience',
      },
      {
        path: 'about',
        loadComponent: () => import('./Admin/about/about').then((m) => m.About),
        title: 'About',
      },
      {
        path: 'projects',
        loadComponent: () => import('./Admin/projects/projects').then((m) => m.Projects),
        title: 'Projects',
      },
      {
        path: 'contact',
        loadComponent: () => import('./Admin/contact/contact').then((m) => m.Contact),
        title: 'Contact',
      },
      {
        path: 'skills',
        loadComponent: () => import('./Admin/skills/skills').then((m) => m.Skills),
        title: 'Skills',
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./Components/login/login').then((m) => m.Login),
    title: 'Login',
  },
  {
    path: '**',
    loadComponent: () => import('./Components/not-found/not-found').then((m) => m.NotFound),
    title: 'Not Found',
  },
];
