import { HttpErrorResponse } from '@angular/common/http';

import { ProblemDetail } from './auth.models';

/**
 * Convierte un error HTTP del backend (ProblemDetail RFC 7807) en un mensaje legible.
 * Concatena los errores de validación por campo cuando están presentes.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    }
    const problem = error.error as ProblemDetail | null;
    if (problem?.errors && Object.keys(problem.errors).length > 0) {
      return Object.values(problem.errors).join(' ');
    }
    if (problem?.detail) {
      return problem.detail;
    }
    if (error.status === 401) {
      return 'Usuario o contraseña inválidos.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.status === 404) {
      return 'Recurso no encontrado.';
    }
    if (error.status === 409) {
      return 'El usuario ya existe.';
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
