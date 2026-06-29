import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { AuthResponse, JwtClaims, LoginRequest, RegisterRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /** Access token (JWT) actual, o `null` si no hay sesión. */
  private readonly token = signal<string | null>(this.storage.getToken());

  /**
   * Petición de refresh en curso, compartida entre llamadas concurrentes. Evita rotar el refresh
   * token más de una vez en paralelo (lo que el backend interpretaría como reuso y revocaría la
   * familia de tokens). Se limpia al completar.
   */
  private refresh$: Observable<AuthResponse> | null = null;

  /** Claims decodificados del token actual (o `null` si no hay/inválido). */
  private readonly claims = computed<JwtClaims | null>(() => decodeJwt(this.token()));

  /** Nombre de usuario de la sesión actual. */
  readonly currentUser = computed(() => this.claims()?.sub ?? null);

  /**
   * Permisos (authorities) del token. El backend emite el claim `authorities` como la unión de los
   * permisos de grano fino (`recurso:acción`, p. ej. `user:read`, `role:create`) de todos los roles
   * del usuario, SIN nombres de rol ni prefijo `ROLE_`. El gating del UI debe basarse en permisos.
   */
  readonly authorities = computed(() => this.claims()?.authorities ?? []);

  /** `true` si hay un access token presente y no expirado. */
  readonly isAuthenticated = computed(() => {
    const claims = this.claims();
    if (!claims) {
      return false;
    }
    return claims.exp * 1000 > Date.now();
  });

  /** `true` si el token actual incluye el permiso indicado (p. ej. `role:create`). */
  hasAuthority(authority: string): boolean {
    return this.authorities().includes(authority);
  }

  /** `true` si el token incluye TODOS los permisos indicados. */
  hasAll(...authorities: string[]): boolean {
    const granted = this.authorities();
    return authorities.every((authority) => granted.includes(authority));
  }

  /** `true` si el token incluye ALGUNO de los permisos indicados. */
  hasAny(...authorities: string[]): boolean {
    const granted = this.authorities();
    return authorities.some((authority) => granted.includes(authority));
  }

  /**
   * Registra un usuario. El backend NO emite tokens en el registro (solo crea la cuenta), por lo
   * que esta operación no inicia sesión: tras registrarse, el usuario debe hacer login.
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/sign-up`, data);
  }

  /**
   * Inicia sesión: persiste el access token recibido y deja que el navegador almacene la cookie
   * HttpOnly del refresh token (`withCredentials`).
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/log-in`, credentials, { withCredentials: true })
      .pipe(tap((res) => this.applyToken(res.accessToken)));
  }

  /**
   * Renueva el access token usando la cookie del refresh token. Comparte la petición en curso para
   * que múltiples llamadas concurrentes (p. ej. varias peticiones que reciben 401 a la vez) usen
   * una sola rotación del refresh token.
   */
  refresh(): Observable<AuthResponse> {
    this.refresh$ ??= this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => this.applyToken(res.accessToken)),
        shareReplay(1),
        finalize(() => (this.refresh$ = null)),
      );
    return this.refresh$;
  }

  /**
   * Intenta renovar la sesión en silencio al arrancar la app. Solo lo hace si hubo una sesión
   * previa (token almacenado, aunque esté expirado); si no hay rastro de sesión, evita una petición
   * innecesaria. Cualquier fallo limpia la sesión local sin propagar el error.
   */
  attemptSilentRefresh(): Observable<boolean> {
    if (!this.storage.getToken()) {
      return of(false);
    }
    return this.refresh().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  /**
   * Cierra la sesión en el backend (revoca el refresh token y añade el access token a la denylist)
   * y limpia el estado local. La llamada al backend es best-effort: la sesión local se limpia y se
   * redirige a login pase lo que pase.
   */
  logout(): void {
    const token = this.token();
    this.http
      .post<void>(
        `${this.baseUrl}/logout`,
        {},
        {
          withCredentials: true,
          // El interceptor excluye los endpoints de /auth/, así que añadimos el Bearer aquí para
          // que el backend pueda identificar y denegar el access token actual.
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )
      .subscribe({ next: () => {}, error: () => {} });

    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /** Devuelve el access token actual para que lo use el interceptor. */
  getToken(): string | null {
    return this.token();
  }

  /** Persiste el access token (si llegó) y actualiza la señal. */
  private applyToken(accessToken: string | undefined): void {
    if (!accessToken) {
      return;
    }
    this.storage.setToken(accessToken);
    this.token.set(accessToken);
  }

  /** Limpia el access token local sin tocar el backend. */
  private clearSession(): void {
    this.storage.clear();
    this.token.set(null);
  }
}

/** Decodifica el payload de un JWT sin validar la firma. Devuelve `null` si es inválido. */
function decodeJwt(token: string | null): JwtClaims | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    const claims = JSON.parse(json) as Partial<JwtClaims>;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') {
      return null;
    }
    return claims as JwtClaims;
  } catch {
    return null;
  }
}
