import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Añade `Authorization: Bearer <accessToken>` a las peticiones dirigidas al backend. Ante un 401
 * (access token ausente, inválido o expirado) intenta renovar el token con la cookie del refresh
 * token y reintenta la petición una vez; si el refresh falla, cierra la sesión.
 *
 * Se excluyen los endpoints públicos de `/auth/` para no enviar tokens viejos al iniciar sesión y
 * para evitar bucles de refresh (el propio `/auth/refresh` no debe disparar otro refresh).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint = req.url.includes('/auth/');
  const isProtected = isApiRequest && !isAuthEndpoint;

  const authReq =
    token && isProtected ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !isProtected) {
        return throwError(() => error);
      }

      // Intenta renovar el access token y reintentar la petición original una sola vez.
      return authService.refresh().pipe(
        switchMap((res) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } })),
        ),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
