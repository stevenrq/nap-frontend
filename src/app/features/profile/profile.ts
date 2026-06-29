import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { toUserMessage } from '../../core/auth/http-error.util';

interface ProfileFormModel {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

/**
 * "Mi perfil": el usuario edita su propia cuenta. Localiza su registro buscando por `username` en
 * `GET /users` (requiere `user:read`) y luego hace `PUT /users/{id}` SIN `roles`. Esto ejercita la
 * ruta de auto-servicio del backend (`@userSecurity.isSelf`): p. ej. `user01` edita su cuenta sin
 * tener `user:update`, y los roles enviados se ignoran (no hay auto-escalada).
 */
@Component({
  selector: 'app-profile',
  imports: [RouterLink, FormField],
  templateUrl: './profile.html',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly canReadUsers = computed(() => this.auth.hasAuthority('user:read'));

  protected readonly ownUser = signal<UserResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly model = signal<ProfileFormModel>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
  });
  protected readonly form = form(this.model, (path) => {
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
  protected readonly submitted = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly saveSuccess = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    const username = this.currentUser();
    if (!username) {
      this.loadError.set('No hay sesión activa.');
      return;
    }
    this.loading.set(true);
    this.loadError.set(null);
    this.userService.getAll().subscribe({
      next: (list) => {
        const own = list.find((u) => u.username === username) ?? null;
        this.ownUser.set(own);
        if (own) {
          this.model.set({
            firstName: own.firstName,
            lastName: own.lastName,
            email: own.email,
            phoneNumber: String(own.phoneNumber),
            username: own.username,
            password: '',
          });
        } else {
          this.loadError.set('No se encontró tu registro de usuario.');
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loadError.set(toUserMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected async onSubmit(): Promise<void> {
    const own = this.ownUser();
    if (!own) {
      return;
    }
    this.submitted.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    await submit(this.form, {
      action: async () => {
        const value = this.model();
        // Sin `roles`: en auto-servicio el backend los ignora.
        const body: UserUpdateRequest = {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim(),
          phoneNumber: Number(value.phoneNumber),
          username: value.username.trim(),
        };
        if (value.password) {
          body.password = value.password;
        }
        try {
          const updated = await firstValueFrom(this.userService.update(own.id, body));
          this.ownUser.set(updated);
          this.saveSuccess.set('Perfil actualizado correctamente.');
        } catch (err: unknown) {
          this.saveError.set(toUserMessage(err));
        }
        return undefined;
      },
    });
  }

  protected showError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.submitted());
  }
}
