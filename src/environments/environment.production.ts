/**
 * Configuración de entorno para producción (build de Vercel).
 *
 * `apiBaseUrl` debe apuntar al backend de autenticación público (Spring Boot).
 * Sustituye el placeholder por la URL real del API antes de desplegar. El backend
 * debe habilitar CORS para el dominio de Vercel.
 *
 * El build de producción usa este archivo en lugar de `environment.ts` mediante el
 * `fileReplacements` definido en `angular.json`.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://CAMBIAME.example.com/api',
};
