import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  FieldTree,
  FormField,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/users/user.service';
import { UserResponse, UserUpdateRequest } from '../../core/users/user.models';
import { RoleService } from '../../core/roles/role.service';
import { Role } from '../../core/roles/role.models';
import { toUserMessage } from '../../core/auth/http-error.util';

/** Modelo del formulario de edición; los campos numéricos se manejan como texto. */
interface UserEditModel {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-users',
  imports: [RouterLink, FormField, DatePipe],
  templateUrl: './users.html',
})
export class Users {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);

  protected readonly canReadUsers = computed(() => this.auth.hasAuthority('user:read'));
  protected readonly canUpdate = computed(() => this.auth.hasAuthority('user:update'));
  protected readonly canDelete = computed(() => this.auth.hasAuthority('user:delete'));

  protected readonly users = signal<UserResponse[]>([]);
  protected readonly usersLoading = signal(false);
  protected readonly usersError = signal<string | null>(null);

  protected readonly searchModel = signal({ id: '' });
  protected readonly searchForm = form(this.searchModel, (path) => {
    required(path.id, { message: 'El ID es obligatorio.' });
    pattern(path.id, /^\d+$/, { message: 'El ID debe ser un número positivo.' });
  });
  protected readonly searchSubmitted = signal(false);
  protected readonly foundUser = signal<UserResponse | null>(null);
  protected readonly searchError = signal<string | null>(null);

  protected readonly deletingId = signal<number | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteSuccessId = signal<number | null>(null);

  // --- Edición ---
  /** Catálogo de roles para asignar; solo se carga si el usuario puede editar. */
  protected readonly allRoles = signal<Role[]>([]);
  protected readonly editingUserId = signal<number | null>(null);
  protected readonly editModel = signal<UserEditModel>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
  });
  protected readonly editForm = form(this.editModel, (path) => {
    required(path.firstName, { message: 'El nombre es obligatorio.' });
    minLength(path.firstName, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });
    maxLength(path.firstName, 20, { message: 'El nombre no puede superar 20 caracteres.' });

    required(path.lastName, { message: 'El apellido es obligatorio.' });
    minLength(path.lastName, 3, { message: 'El apellido debe tener al menos 3 caracteres.' });
    maxLength(path.lastName, 20, { message: 'El apellido no puede superar 20 caracteres.' });

    required(path.email, { message: 'El correo es obligatorio.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    minLength(path.email, 16, { message: 'El correo debe tener al menos 16 caracteres.' });
    maxLength(path.email, 40, { message: 'El correo no puede superar 40 caracteres.' });

    required(path.phoneNumber, { message: 'El teléfono es obligatorio.' });
    pattern(path.phoneNumber, /^\d{1,10}$/, {
      message: 'El teléfono debe ser numérico de hasta 10 dígitos.',
    });

    required(path.username, { message: 'El usuario es obligatorio.' });
    minLength(path.username, 5, { message: 'El usuario debe tener al menos 5 caracteres.' });
    maxLength(path.username, 20, { message: 'El usuario no puede superar 20 caracteres.' });
  });
  protected readonly editRoleNames = signal<string[]>([]);
  protected readonly editSubmitted = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly editSuccess = signal<string | null>(null);

  constructor() {
    if (this.canReadUsers()) {
      this.loadAll();
    }
    if (this.canUpdate()) {
      this.loadRoles();
    }
  }

  protected loadAll(): void {
    this.usersLoading.set(true);
    this.usersError.set(null);
    this.userService.getAll().subscribe({
      next: (list) => {
        this.users.set(list);
        this.usersLoading.set(false);
      },
      error: (err: unknown) => {
        this.usersError.set(toUserMessage(err));
        this.usersLoading.set(false);
      },
    });
  }

  protected loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (list) => this.allRoles.set(list),
      error: () => this.allRoles.set([]),
    });
  }

  protected async onSearch(): Promise<void> {
    this.searchSubmitted.set(true);
    this.foundUser.set(null);
    this.searchError.set(null);

    await submit(this.searchForm, {
      action: async () => {
        try {
          const id = Number(this.searchModel().id);
          const user = await firstValueFrom(this.userService.getById(id));
          this.foundUser.set(user);
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

  protected deleteUser(id: number): void {
    this.deletingId.set(id);
    this.deleteError.set(null);
    this.deleteSuccessId.set(null);
    this.userService.deleteById(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.deleteSuccessId.set(id);
        this.users.update((list) => list.filter((u) => u.id !== id));
        if (this.editingUserId() === id) {
          this.editingUserId.set(null);
        }
      },
      error: (err: unknown) => {
        this.deletingId.set(null);
        this.deleteError.set(toUserMessage(err));
      },
    });
  }

  protected startEdit(user: UserResponse): void {
    this.editingUserId.set(user.id);
    this.editModel.set({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: String(user.phoneNumber),
      username: user.username,
      password: '',
    });
    this.editRoleNames.set([...user.roles]);
    this.editSubmitted.set(false);
    this.editError.set(null);
    this.editSuccess.set(null);
  }

  protected cancelEdit(): void {
    this.editingUserId.set(null);
  }

  protected async saveEdit(): Promise<void> {
    const id = this.editingUserId();
    if (id === null) {
      return;
    }
    this.editSubmitted.set(true);
    this.editError.set(null);
    this.editSuccess.set(null);

    await submit(this.editForm, {
      action: async () => {
        const value = this.editModel();
        const roles = this.allRoles().filter((role) => this.editRoleNames().includes(role.name));
        const body: UserUpdateRequest = {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim(),
          phoneNumber: Number(value.phoneNumber),
          username: value.username.trim(),
          roles,
        };
        if (value.password) {
          body.password = value.password;
        }
        try {
          const updated = await firstValueFrom(this.userService.update(id, body));
          this.users.update((list) => list.map((u) => (u.id === id ? updated : u)));
          if (this.foundUser()?.id === id) {
            this.foundUser.set(updated);
          }
          this.editSuccess.set('Usuario actualizado correctamente.');
        } catch (err: unknown) {
          this.editError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected toggleEditRole(name: string, checked: boolean): void {
    this.editRoleNames.update((current) =>
      checked ? [...current, name] : current.filter((selected) => selected !== name),
    );
  }

  protected isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected showEditError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.editSubmitted());
  }
}
