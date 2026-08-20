import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Configuración principal de la aplicación Angular 18
 * Utiliza standalone components y las últimas características
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Router con scroll y transiciones de vista
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    
    // HTTP Client con fetch API e interceptores
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    
    // Hydration para SSR (Server-Side Rendering)
    provideClientHydration(),

    // Animaciones
    provideAnimationsAsync(),

    // PrimeNG — tema Aura con colores CERMAT
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          prefix: 'p',
        },
      },
    }),
  ],
};
