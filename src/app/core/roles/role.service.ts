import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Role,
  RoleCreationRequest,
  RolePermissionsRequest,
  RoleUpdateRequest,
} from './role.models';

/** CRUD de roles (`/api/roles`). Cada método mapea 1:1 con un endpoint del backend. */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/roles`;

  /** GET /roles — requiere `role:read`. */
  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  /** GET /roles/{id} — requiere `role:read`. */
  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  /** GET /roles/search?name= — requiere `role:read`. */
  searchByName(name: string): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/search`, {
      params: new HttpParams().set('name', name),
    });
  }

  /** POST /roles — requiere `role:create`. */
  create(body: RoleCreationRequest): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, body);
  }

  /** PUT /roles/{id} — actualiza nombre/descripción; requiere `role:update`. */
  update(id: number, body: RoleUpdateRequest): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}`, body);
  }

  /** PUT /roles/{id}/permissions — reemplaza el conjunto de permisos; requiere `role:update`. */
  updatePermissions(id: number, body: RolePermissionsRequest): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}/permissions`, body);
  }

  /** DELETE /roles/{id} — requiere `role:delete`. */
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
