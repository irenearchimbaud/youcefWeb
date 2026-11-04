import { Routes } from '@angular/router';
import { roleGuard, sessionGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'devis', loadComponent: () => import('./pages/devis/devis').then((m) => m.Devis) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'mot-de-passe-oublie', loadComponent: () => import('./pages/mot-de-passe-oublie/mot-de-passe-oublie').then((m) => m.MotDePasseOublie) },
  {
    path: 'nouveau-mot-de-passe',
    canActivate: [sessionGuard],
    loadComponent: () => import('./pages/nouveau-mot-de-passe/nouveau-mot-de-passe').then((m) => m.NouveauMotDePasse),
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./pages/mentions-legales/mentions-legales').then((m) => m.MentionsLegales),
  },
  {
    path: 'politique-confidentialite',
    loadComponent: () => import('./pages/politique-confidentialite/politique-confidentialite').then((m) => m.PolitiqueConfidentialite),
  },
  {
    path: 'conditions-generales',
    loadComponent: () => import('./pages/conditions-generales/conditions-generales').then((m) => m.ConditionsGenerales),
  },
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
  {
    path: 'espace-pro/client/:id',
    canActivate: [roleGuard('pro')],
    loadComponent: () => import('./pages/fiche-client/fiche-client').then((m) => m.FicheClient),
  },
  { path: '**', redirectTo: '' },
];
