/** Modelos de roles (`/roles`), alineados con la API del backend. */

import { Permission } from '../permissions/permission.models';

/**
 * Un rol: agrupación dinámica de permisos del catálogo. El backend devuelve los permisos como
 * objetos `Permission` completos.
 */
export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

/** Cuerpo de POST /roles. Los permisos se referencian por nombre del catálogo. */
export interface RoleCreationRequest {
  name: string;
  description?: string | null;
  permissionNames?: string[];
}

/** Cuerpo de PUT /roles/{id}. Solo actualiza nombre y descripción (no los permisos). */
export interface RoleUpdateRequest {
  name: string;
  description?: string | null;
}

/** Cuerpo de PUT /roles/{id}/permissions. Reemplaza el conjunto completo de permisos del rol. */
export interface RolePermissionsRequest {
  permissionNames: string[];
}
