import { Role } from '../roles/role.models';

export interface Address {
  id: number;
  street: string;
  number: string;
  city: string;
}

export interface UserResponse {
  id: number;
  nationalId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
  address: Address | null;
  username: string;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Cuerpo de PUT /users/{id}. `password` es opcional (solo si se cambia). `roles` se envía como
 * objetos `Role` completos (lo que el backend espera). En auto-edición (`isSelf`) se omite `roles`:
 * el backend ignora los roles enviados por el propio usuario, así que no hay auto-escalada.
 */
export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
  username: string;
  password?: string;
  address?: Address | null;
  roles?: Role[];
}
