import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Las páginas públicas (login/registro) se prerenderizan. Las rutas que dependen de la
 * sesión (guard + `localStorage`) se renderizan en el cliente para no ejecutar el guard
 * en tiempo de build ni prerenderizar contenido protegido.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Client },
  { path: 'users', renderMode: RenderMode.Client },
  { path: '', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
