import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Permission } from './permission.models';

/** Acceso de solo lectura al catálogo de permisos (`/api/permissions`). Requiere `permission:read`. */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/permissions`;

  /** GET /permissions — todo el catálogo. */
  getAll(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.baseUrl);
  }

  /** GET /permissions/{id}. */
  getById(id: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.baseUrl}/${id}`);
  }

  /** GET /permissions/search?name= — un permiso por nombre exacto. */
  searchByName(name: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.baseUrl}/search`, {
      params: new HttpParams().set('name', name),
    });
  }
}
