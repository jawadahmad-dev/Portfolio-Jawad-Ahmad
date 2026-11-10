import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DialogService } from 'primeng/dynamicdialog';
import { loadingInterceptor } from './Core/Interceptors/loading-interceptor';
import { tokenInterceptor } from './Core/Interceptors/token-interceptor';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideAuth, getAuth } from '@angular/fire/auth';



const firebaseConfig = {
  apiKey: "AIzaSyB9xsKSBA7jMzXYeExaCWgvx5qaW-n4Y7I",
  authDomain: "portfolio-f2da0.firebaseapp.com",
  databaseURL: "https://portfolio-f2da0-default-rtdb.firebaseio.com",
  projectId: "portfolio-f2da0",
  storageBucket: "portfolio-f2da0.firebasestorage.app",
  messagingSenderId: "592403795029",
  appId: "1:592403795029:web:0481460ef0a8cacc3598dc",
  measurementId: "G-30Y8T8M081"
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideHttpClient(withInterceptors([tokenInterceptor, loadingInterceptor])),
    provideAnimationsAsync(),
    MessageService,
    ConfirmationService,
    DialogService,
     // Firebase initialization
     provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideDatabase(() => getDatabase()),
    provideAuth(() => getAuth()),
  ],
};
