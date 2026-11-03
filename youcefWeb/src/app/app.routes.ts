import { Routes } from '@angular/router';
import { roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: 'espace-client',
    canActivate: [roleGuard('client')],
    loadComponent: () => import('./pages/espace-client/espace-client').then((m) => m.EspaceClient),
  },
  {
    path: 'espace-pro',
    canActivate: [roleGuard('pro')],
    loadComponent: () => import('./pages/espace-pro/espace-pro').then((m) => m.EspacePro),
  },
  { path: '**', redirectTo: '' },
];
