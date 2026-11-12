import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Database, ref, get, set, push, remove, DataSnapshot } from '@angular/fire/database';
import { Shared } from './shared';
import { ExperianceModel } from '../Models/Experiance';
import { ProjectsModel } from '../Models/Projects';
import { SkillsModel } from '../Models/Skills';
import { AboutModel } from '../Models/About';
import { HeroModel } from '../Models/Hero';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ContactModel, Web3FormsResponse } from '../Models/Contact';

@Injectable({ providedIn: 'root' })
export class Rest {
  private readonly db = inject(Database);
  private readonly injector = inject(Injector);
  private readonly sharedService = inject(Shared);
  private readonly http = inject(HttpClient);

  //-------------Aut-----------

  Login(data: { email: string; loggedIn: boolean }): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => set(ref(this.db, 'auth'), data)).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  getLoggedInUser(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'auth'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  getUsers(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'users'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  logOut(): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () =>
      set(ref(this.db, 'auth'), { email: '', loggedIn: false }),
    ).finally(() => this.sharedService.hideLoading());
  }

  // ---- Experience ----

  getExperiences(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'experience'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  /** Creates a new entry when `id` is omitted, otherwise overwrites that entry. */
  saveExperience(data: ExperianceModel, id?: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => {
      const key = id ?? push(ref(this.db, 'experience')).key!;
      return set(ref(this.db, `experience/${key}`), data);
    }).finally(() => this.sharedService.hideLoading());
  }

  deleteExperience(id: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.db, `experience/${id}`)),
    ).finally(() => this.sharedService.hideLoading());
  }

  // ---- Projects ----

  getProjects(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'projects'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  saveProjects(data: ProjectsModel, id?: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => {
      const key = id ?? push(ref(this.db, 'projects')).key!;
      return set(ref(this.db, `projects/${key}`), data);
    }).finally(() => this.sharedService.hideLoading());
  }

  deleteProjects(id: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.db, `projects/${id}`)),
    ).finally(() => this.sharedService.hideLoading());
  }

  // ---- Skills ----

  getSkills(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'skills'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  saveSkills(data: SkillsModel, id?: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => {
      const key = id ?? push(ref(this.db, 'skills')).key!;
      return set(ref(this.db, `skills/${key}`), data);
    }).finally(() => this.sharedService.hideLoading());
  }

  deleteSkills(id: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => remove(ref(this.db, `skills/${id}`))).finally(
      () => this.sharedService.hideLoading(),
    );
  }

  // ---- About ----

  getAbout(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'about'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  saveAbout(data: AboutModel, id?: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => {
      const key = id ?? push(ref(this.db, 'about')).key!;
      return set(ref(this.db, `about/${key}`), data);
    }).finally(() => this.sharedService.hideLoading());
  }

  deleteAbout(id: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => remove(ref(this.db, `about/${id}`))).finally(
      () => this.sharedService.hideLoading(),
    );
  }

  // ---- Her Section ----

  getHero(): Promise<DataSnapshot> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => get(ref(this.db, 'hero'))).finally(() =>
      this.sharedService.hideLoading(),
    );
  }

  saveHero(data: HeroModel, id?: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => {
      const key = id ?? push(ref(this.db, 'hero')).key!;
      return set(ref(this.db, `hero/${key}`), data);
    }).finally(() => this.sharedService.hideLoading());
  }

  deleteHero(id: string): Promise<void> {
    this.sharedService.showLoading();
    return runInInjectionContext(this.injector, () => remove(ref(this.db, `hero/${id}`))).finally(
      () => this.sharedService.hideLoading(),
    );
  }

  // ---- Contact Form Submission ----
  sendContactForm(payload: ContactModel): Observable<Web3FormsResponse> {
    return this.http.post<Web3FormsResponse>('https://api.web3forms.com/submit', payload);
  }
}
