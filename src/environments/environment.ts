/**
 * Configuración de entorno del frontend.
 *
 * `apiBaseUrl` apunta al backend de autenticación (Spring Boot). El backend debe
 * exponer CORS para este origen. Para producción, crear `environment.production.ts`
 * y registrar un `fileReplacements` en `angular.json`.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
};
