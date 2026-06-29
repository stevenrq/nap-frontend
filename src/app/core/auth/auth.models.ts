/** Modelos de datos para la autenticación, alineados con la API del backend (`/auth`). */

/** Cuerpo de POST /auth/log-in. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Cuerpo de POST /auth/sign-up. */
export interface RegisterRequest {
  nationalId: number;
  firstName: string;
  lastName: string;
  phoneNumber: number;
  email: string;
  username: string;
  password: string;
}

/**
 * Respuesta de autenticación del backend.
 *
 * - `POST /auth/log-in` (200) y `POST /auth/refresh` (200) incluyen `accessToken`.
 * - `POST /auth/sign-up` (201) NO emite tokens: `accessToken` viene ausente (el registro solo
 *   crea la cuenta; el usuario debe iniciar sesión después).
 *
 * El refresh token viaja aparte, en una cookie HttpOnly (`refresh_token`) que el navegador
 * gestiona automáticamente; nunca es accesible desde JavaScript.
 */
export interface AuthResponse {
  username: string;
  message: string;
  accessToken?: string;
}

/**
 * Respuesta de error RFC 7807 (ProblemDetail) del backend. `errors` está presente en
 * fallos de validación (400) y mapea campo -> mensaje.
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}

/** Claims relevantes del JWT emitido por el backend. */
export interface JwtClaims {
  sub: string;
  exp: number;
  iat?: number;
  /**
   * Permisos de grano fino (`recurso:acción`, p. ej. `user:read`) — la unión de los permisos de
   * todos los roles del usuario. NO contiene nombres de rol ni prefijo `ROLE_`.
   */
  authorities?: string[];
}
