/**
 * Modelos del catálogo de permisos (`/permissions`). Los permisos son propiedad de la API y de solo
 * lectura por HTTP: el frontend solo los lee (lista, detalle, búsqueda por nombre).
 */

/** Un permiso de grano fino `recurso:acción` del catálogo del backend. */
export interface Permission {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
