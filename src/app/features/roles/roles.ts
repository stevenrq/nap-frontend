import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  FieldTree,
  FormField,
  form,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RoleService } from '../../core/roles/role.service';
import { PermissionService } from '../../core/permissions/permission.service';
import { Role } from '../../core/roles/role.models';
import { Permission } from '../../core/permissions/permission.models';
import { toUserMessage } from '../../core/auth/http-error.util';

interface RoleFormModel {
  name: string;
  description: string;
}

/**
 * Gestión de roles. Ejercita los 7 endpoints de `/roles`: listar, ver/buscar, crear, actualizar
 * nombre/descripción (PUT {id}), reemplazar permisos (PUT {id}/permissions) y eliminar. Cada acción
 * se gatea por el permiso correspondiente (`role:read|create|update|delete`); el backend es la
 * autoridad final (responde 403 si falta el permiso).
 */
@Component({
  selector: 'app-roles',
  imports: [RouterLink, FormField, DatePipe],
  templateUrl: './roles.html',
})
export class Roles {
  private readonly auth = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);

  protected readonly canRead = computed(() => this.auth.hasAuthority('role:read'));
  protected readonly canCreate = computed(() => this.auth.hasAuthority('role:create'));
  protected readonly canUpdate = computed(() => this.auth.hasAuthority('role:update'));
  protected readonly canDelete = computed(() => this.auth.hasAuthority('role:delete'));

  protected readonly roles = signal<Role[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly rolesError = signal<string | null>(null);

  /** Catálogo de permisos disponible para asignar a un rol. */
  protected readonly catalog = signal<Permission[]>([]);
  protected readonly catalogError = signal<string | null>(null);

  // --- Crear rol ---
  protected readonly createModel = signal<RoleFormModel>({ name: '', description: '' });
  protected readonly createForm = form(this.createModel, (path) => {
    required(path.name, { message: 'El nombre es obligatorio.' });
    minLength(path.name, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });
    maxLength(path.name, 20, { message: 'El nombre no puede superar 20 caracteres.' });
  });
  protected readonly createPermissions = signal<string[]>([]);
  protected readonly createSubmitted = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly createSuccess = signal<string | null>(null);

  // --- Buscar rol por nombre ---
  protected readonly searchModel = signal({ name: '' });
  protected readonly searchForm = form(this.searchModel, (path) => {
    required(path.name, { message: 'El nombre es obligatorio.' });
  });
  protected readonly searchSubmitted = signal(false);
  protected readonly foundRole = signal<Role | null>(null);
  protected readonly searchError = signal<string | null>(null);

  // --- Editar rol ---
  protected readonly editingRoleId = signal<number | null>(null);
  protected readonly editModel = signal<RoleFormModel>({ name: '', description: '' });
  protected readonly editForm = form(this.editModel, (path) => {
    required(path.name, { message: 'El nombre es obligatorio.' });
    minLength(path.name, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });
    maxLength(path.name, 20, { message: 'El nombre no puede superar 20 caracteres.' });
  });
  protected readonly editPermissions = signal<string[]>([]);
  protected readonly editSubmitted = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly editDataSuccess = signal<string | null>(null);
  protected readonly editPermsSuccess = signal<string | null>(null);
  protected readonly savingPermissions = signal(false);

  // --- Eliminar rol ---
  protected readonly deletingId = signal<number | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteSuccessId = signal<number | null>(null);

  constructor() {
    if (this.canRead()) {
      this.loadAll();
    }
    if (this.canCreate() || this.canUpdate()) {
      this.loadCatalog();
    }
  }

  protected loadAll(): void {
    this.rolesLoading.set(true);
    this.rolesError.set(null);
    this.roleService.getAll().subscribe({
      next: (list) => {
        this.roles.set(list);
        this.rolesLoading.set(false);
      },
      error: (err: unknown) => {
        this.rolesError.set(toUserMessage(err));
        this.rolesLoading.set(false);
      },
    });
  }

  protected loadCatalog(): void {
    this.catalogError.set(null);
    this.permissionService.getAll().subscribe({
      next: (list) => this.catalog.set(list),
      error: (err: unknown) => this.catalogError.set(toUserMessage(err)),
    });
  }

  protected async onCreate(): Promise<void> {
    this.createSubmitted.set(true);
    this.createError.set(null);
    this.createSuccess.set(null);

    await submit(this.createForm, {
      action: async () => {
        const value = this.createModel();
        try {
          const role = await firstValueFrom(
            this.roleService.create({
              name: value.name.trim(),
              description: value.description.trim() || null,
              permissionNames: this.createPermissions(),
            }),
          );
          this.roles.update((list) => [...list, role]);
          this.createSuccess.set(`Rol "${role.name}" creado correctamente.`);
          this.createModel.set({ name: '', description: '' });
          this.createPermissions.set([]);
          this.createSubmitted.set(false);
        } catch (err: unknown) {
          this.createError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected async onSearch(): Promise<void> {
    this.searchSubmitted.set(true);
    this.foundRole.set(null);
    this.searchError.set(null);

    await submit(this.searchForm, {
      action: async () => {
        try {
          const role = await firstValueFrom(
            this.roleService.searchByName(this.searchModel().name.trim()),
          );
          this.foundRole.set(role);
        } catch (err: unknown) {
          this.searchError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected startEdit(role: Role): void {
    this.editingRoleId.set(role.id);
    this.editModel.set({ name: role.name, description: role.description ?? '' });
    this.editPermissions.set(role.permissions.map((permission) => permission.name));
    this.editSubmitted.set(false);
    this.editError.set(null);
    this.editDataSuccess.set(null);
    this.editPermsSuccess.set(null);
  }

  protected cancelEdit(): void {
    this.editingRoleId.set(null);
  }

  protected async saveRoleData(): Promise<void> {
    const id = this.editingRoleId();
    if (id === null) {
      return;
    }
    this.editSubmitted.set(true);
    this.editError.set(null);
    this.editDataSuccess.set(null);

    await submit(this.editForm, {
      action: async () => {
        const value = this.editModel();
        try {
          const updated = await firstValueFrom(
            this.roleService.update(id, {
              name: value.name.trim(),
              description: value.description.trim() || null,
            }),
          );
          this.applyUpdatedRole(updated);
          this.editDataSuccess.set('Datos del rol actualizados.');
        } catch (err: unknown) {
          this.editError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected saveRolePermissions(): void {
    const id = this.editingRoleId();
    if (id === null) {
      return;
    }
    this.savingPermissions.set(true);
    this.editError.set(null);
    this.editPermsSuccess.set(null);

    this.roleService.updatePermissions(id, { permissionNames: this.editPermissions() }).subscribe({
      next: (updated) => {
        this.applyUpdatedRole(updated);
        this.editPermsSuccess.set('Permisos del rol actualizados.');
        this.savingPermissions.set(false);
      },
      error: (err: unknown) => {
        this.editError.set(toUserMessage(err));
        this.savingPermissions.set(false);
      },
    });
  }

  protected deleteRole(id: number): void {
    this.deletingId.set(id);
    this.deleteError.set(null);
    this.deleteSuccessId.set(null);
    this.roleService.deleteById(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.deleteSuccessId.set(id);
        this.roles.update((list) => list.filter((role) => role.id !== id));
        if (this.editingRoleId() === id) {
          this.editingRoleId.set(null);
        }
      },
      error: (err: unknown) => {
        this.deletingId.set(null);
        this.deleteError.set(toUserMessage(err));
      },
    });
  }

  protected toggleCreatePermission(name: string, checked: boolean): void {
    this.createPermissions.update((current) =>
      checked ? [...current, name] : current.filter((selected) => selected !== name),
    );
  }

  protected toggleEditPermission(name: string, checked: boolean): void {
    this.editPermissions.update((current) =>
      checked ? [...current, name] : current.filter((selected) => selected !== name),
    );
  }

  /** Lee el estado `checked` de un `<input type="checkbox">` desde su evento `change`. */
  protected isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected showCreateError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.createSubmitted());
  }

  protected showEditError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.editSubmitted());
  }

  protected showSearchError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.searchSubmitted());
  }

  /** Reemplaza un rol en la lista (y en el resultado de búsqueda) tras una actualización. */
  private applyUpdatedRole(updated: Role): void {
    this.roles.update((list) => list.map((role) => (role.id === updated.id ? updated : role)));
    if (this.foundRole()?.id === updated.id) {
      this.foundRole.set(updated);
    }
  }
}
