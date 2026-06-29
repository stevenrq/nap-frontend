import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'home',
    title: 'Inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'users',
    title: 'Usuarios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/users/users').then((m) => m.Users),
  },
  {
    path: 'roles',
    title: 'Roles',
    canActivate: [authGuard],
    loadComponent: () => import('./features/roles/roles').then((m) => m.Roles),
  },
  {
    path: 'permissions',
    title: 'Permisos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/permissions/permissions').then((m) => m.Permissions),
  },
  {
    path: 'profile',
    title: 'Mi perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
