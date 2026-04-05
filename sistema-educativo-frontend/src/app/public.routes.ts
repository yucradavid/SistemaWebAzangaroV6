import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/landing/landing.component').then(m => m.HomeComponent),
        title: 'CERMAT SCHOOL - Inicio | Colegio Privado en Azángaro',
      },
      {
        path: 'admision',
        loadComponent: () => import('./features/public/admision/admision/admision.component').then(m => m.AdmisionComponent),
        title: 'Proceso de Admisión 2026 - CERMAT SCHOOL',
      },
      {
        path: 'niveles',
        children: [
          {
            path: '',
            redirectTo: 'inicial',
            pathMatch: 'full'
          },
          {
            path: 'inicial',
            loadComponent: () => import('./features/public/niveles/inicial/inicial.component').then(m => m.InicialComponent),
            title: 'Nivel Inicial - CERMAT SCHOOL',
          },
          {
            path: 'primaria',
            loadComponent: () => import('./features/public/niveles/primaria/primaria.component').then(m => m.PrimariaComponent),
            title: 'Nivel Primaria - CERMAT SCHOOL',
          },
          {
            path: 'secundaria',
            loadComponent: () => import('./features/public/niveles/secundaria/secundaria.component').then(m => m.SecundariaComponent),
            title: 'Nivel Secundaria - CERMAT SCHOOL',
          }
        ]
      },
      {
        path: 'docentes',
        loadComponent: () => import('./features/public/docente/docente/docente.component').then(m => m.DocenteComponent),
        title: 'Plana Docente - CERMAT SCHOOL',
      },
      {
        path: 'noticias',
        children: [
          {
            path: '', // This path is for the news list
            loadComponent: () => import('./features/public/noticias/noticias-list/noticias-list.component').then(m => m.NoticiasListComponent),
            title: 'Noticias y Eventos - CERMAT SCHOOL',
          },
          {
            path: ':slug',
            loadComponent: () => import('./features/public/noticias/noticias-detail/noticias-detail.component').then(m => m.NoticiasDetailComponent),
            title: 'Noticia - CERMAT SCHOOL'
          }
        ]
      },
      {
        path: 'transparencia',
        loadComponent: () => import('./features/public/transparencia/transparencia/transparencia.component').then(m => m.TransparenciaComponent),
        title: 'Transparencia - CERMAT SCHOOL',
      },
      {
        path: 'contacto',
        loadComponent: () => import('./features/public/contacto/contacto/contacto.component').then(m => m.ContactoComponent),
        title: 'Contacto - CERMAT SCHOOL',
      }
    ]
  }
];