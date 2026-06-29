import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Acceso SSR-safe al almacenamiento del JWT.
 *
 * `localStorage` no existe en el servidor (SSR), por lo que en ese contexto todas las
 * operaciones son no-ops y `getToken()` devuelve `null`.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private static readonly KEY = 'nap.jwt';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(TokenStorageService.KEY);
  }

  setToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(TokenStorageService.KEY, token);
  }

  clear(): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.removeItem(TokenStorageService.KEY);
  }
}
