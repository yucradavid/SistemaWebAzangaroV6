import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { backendInterceptor } from './core/interceptors/backend.interceptor';

/**
 * Configuración principal de la aplicación Angular 18
 * Standalone components — sin NgModules
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Router con scroll, view transitions y rutas
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      withViewTransitions()
    ),

    // HTTP Client con fetch API e interceptores
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, backendInterceptor])
    ),

    // Animaciones (async para PrimeNG)
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

