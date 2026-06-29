# NAP Frontend

Frontend de autenticación y administración (usuarios, roles y permisos) construido con **Angular 22**. Consume una API REST de **Spring Boot** y se despliega como **SPA estático** en Vercel.

## Características

- **Autenticación JWT** con access token de vida corta (en `localStorage`) y refresh token en cookie **HttpOnly** (`withCredentials`).
- **Refresh silencioso** al arrancar la app para mantener la sesión tras recargar, con rotación de refresh token protegida contra reuso concurrente.
- **Autorización por permisos** de grano fino (`recurso:acción`, p. ej. `user:read`, `role:create`). El gating del UI se basa en los `authorities` del token, no en nombres de rol.
- **Guard de ruta** e **interceptor HTTP** que adjunta el `Bearer` y renueva el token ante un `401`.
- Gestión de **usuarios, roles y permisos**, más perfil de usuario.
- **Standalone components**, **signals** para estado y **lazy loading** por ruta.
- **Tailwind CSS v4** para estilos.

## Requisitos

- **Node.js 22.x** (ver `engines` en `package.json`).
- **npm 11+**.
- Backend de autenticación (Spring Boot) accesible, con **CORS** habilitado para el origen del frontend.

## Puesta en marcha

```bash
npm install
npm start          # ng serve → http://localhost:4200
```

Por defecto el entorno de desarrollo apunta a `http://localhost:8080/api` (ver `src/environments/environment.ts`).

## Configuración de entornos

La URL del API se resuelve en tiempo de build mediante dos archivos y un `fileReplacements` en `angular.json`:

| Entorno | Archivo | `apiBaseUrl` |
|---|---|---|
| Desarrollo (`ng serve`) | `src/environments/environment.ts` | `http://localhost:8080/api` |
| Producción (`ng build`) | `src/environments/environment.production.ts` | URL pública del backend |

> Antes de desplegar, edita `src/environments/environment.production.ts` y sustituye el placeholder `https://CAMBIAME.example.com/api` por la URL real de tu API.

## Scripts

```bash
npm start      # servidor de desarrollo (ng serve)
npm run build  # build de producción → dist/nap-frontend/browser
npm run watch  # build incremental en modo desarrollo
npm test       # tests unitarios (Vitest vía Angular CLI)
```

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                 # servicios singleton y lógica transversal
│   │   ├── auth/             # AuthService, guard, interceptor, almacenamiento de token
│   │   ├── users/            # servicio y modelos de usuarios
│   │   ├── roles/            # servicio y modelos de roles
│   │   └── permissions/      # servicio y modelos de permisos
│   ├── features/             # rutas con lazy loading
│   │   ├── auth/             # login y registro
│   │   ├── home/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   └── profile/
│   ├── app.routes.ts         # rutas de la aplicación
│   ├── app.routes.server.ts  # render mode por ruta (prerender / cliente)
│   └── app.config.ts         # providers (router, http, hidratación, init de sesión)
└── environments/             # configuración por entorno
```

## Despliegue en Vercel

El proyecto se construye como **SPA estático** (`outputMode: static` en `angular.json`). Las páginas públicas `login` y `register` se **prerenderizan**; el resto de rutas se renderizan en cliente (dependen de la sesión en `localStorage`/cookies).

La configuración está en `vercel.json`:

- **Build command:** `npm run build`
- **Output directory:** `dist/nap-frontend/browser`
- **Rewrite SPA:** todo se redirige a `/index.csr.html` como fallback.

### Pasos

1. Edita `src/environments/environment.production.ts` con la URL real del API y commitea.
2. Importa el repositorio en Vercel (detectará `vercel.json` automáticamente), o despliega desde la raíz:

   ```bash
   npx vercel          # preview
   npx vercel --prod   # producción
   ```

3. Asegúrate de que el backend habilita **CORS** para el dominio de Vercel.

## Tecnologías

- [Angular 22](https://angular.dev/) — standalone components, signals, control flow nativo.
- [Tailwind CSS v4](https://tailwindcss.com/).
- [Vitest](https://vitest.dev/) para tests unitarios.
- [Vercel](https://vercel.com/) para el hosting estático.
