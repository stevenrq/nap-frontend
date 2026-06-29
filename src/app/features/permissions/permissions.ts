import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FieldTree, FormField, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/permissions/permission.service';
import { Permission } from '../../core/permissions/permission.models';
import { toUserMessage } from '../../core/auth/http-error.util';

/**
 * Catálogo de permisos (solo lectura). Ejercita GET /permissions, /permissions/{id} (vía búsqueda
 * por nombre se usa /search). Requiere el permiso `permission:read`; sin él, el backend responde 403
 * y se muestra un aviso.
 */
@Component({
  selector: 'app-permissions',
  imports: [RouterLink, FormField, DatePipe],
  templateUrl: './permissions.html',
})
export class Permissions {
  private readonly auth = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  protected readonly canRead = computed(() => this.auth.hasAuthority('permission:read'));

  protected readonly permissions = signal<Permission[]>([]);
  protected readonly loading = signal(false);
  protected readonly listError = signal<string | null>(null);

  protected readonly searchModel = signal({ name: '' });
  protected readonly searchForm = form(this.searchModel, (path) => {
    required(path.name, { message: 'El nombre es obligatorio.' });
  });
  protected readonly searchSubmitted = signal(false);
  protected readonly foundPermission = signal<Permission | null>(null);
  protected readonly searchError = signal<string | null>(null);

  constructor() {
    if (this.canRead()) {
      this.loadAll();
    }
  }

  protected loadAll(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.permissionService.getAll().subscribe({
      next: (list) => {
        this.permissions.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(toUserMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected async onSearch(): Promise<void> {
    this.searchSubmitted.set(true);
    this.foundPermission.set(null);
    this.searchError.set(null);

    await submit(this.searchForm, {
      action: async () => {
        try {
          const permission = await firstValueFrom(
            this.permissionService.searchByName(this.searchModel().name.trim()),
          );
          this.foundPermission.set(permission);
        } catch (err: unknown) {
          this.searchError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected showSearchError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.searchSubmitted());
  }
}
