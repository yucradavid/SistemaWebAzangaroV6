import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Rutas principales de la aplicación
 * Lazy loading para optimizar la carga inicial
 */
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./public.routes').then(m => m.PUBLIC_ROUTES)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-mock/login-mock.component').then(m => m.LoginMockComponent),
    title: 'CERMAT Portal - Iniciar sesión'
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () => import('./private.routes').then(m => m.PRIVATE_ROUTES)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];