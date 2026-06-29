import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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

import { AuthService } from '../../../core/auth/auth.service';
import { toUserMessage } from '../../../core/auth/http-error.util';

/**
 * Modelo del formulario; `nationalId` y `phoneNumber` se manejan como texto y se convierten a
 * número al enviar.
 */
interface RegisterForm {
  nationalId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly model = signal<RegisterForm>({
    nationalId: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    username: '',
    password: '',
  });

  protected readonly form = form(this.model, (path) => {
    required(path.nationalId, { message: 'El documento de identidad es obligatorio.' });
    pattern(path.nationalId, /^\d{1,10}$/, {
      message: 'El documento debe ser numérico de hasta 10 dígitos.',
    });

    required(path.firstName, { message: 'El nombre es obligatorio.' });
    minLength(path.firstName, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });
    maxLength(path.firstName, 20, { message: 'El nombre no puede superar 20 caracteres.' });

    required(path.lastName, { message: 'El apellido es obligatorio.' });
    minLength(path.lastName, 3, { message: 'El apellido debe tener al menos 3 caracteres.' });
    maxLength(path.lastName, 20, { message: 'El apellido no puede superar 20 caracteres.' });

    required(path.phoneNumber, { message: 'El teléfono es obligatorio.' });
    pattern(path.phoneNumber, /^\d{1,10}$/, {
      message: 'El teléfono debe ser numérico de hasta 10 dígitos.',
    });

    required(path.email, { message: 'El correo es obligatorio.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    minLength(path.email, 16, { message: 'El correo debe tener al menos 16 caracteres.' });
    maxLength(path.email, 40, { message: 'El correo no puede superar 40 caracteres.' });

    required(path.username, { message: 'El usuario es obligatorio.' });
    minLength(path.username, 5, { message: 'El usuario debe tener al menos 5 caracteres.' });
    maxLength(path.username, 20, { message: 'El usuario no puede superar 20 caracteres.' });

    required(path.password, { message: 'La contraseña es obligatoria.' });
    minLength(path.password, 5, { message: 'La contraseña debe tener al menos 5 caracteres.' });
    maxLength(path.password, 60, { message: 'La contraseña no puede superar 60 caracteres.' });
  });

  protected readonly submitted = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set(null);

    await submit(this.form, {
      action: async () => {
        const value = this.model();
        try {
          await firstValueFrom(
            this.auth.register({
              nationalId: Number(value.nationalId),
              firstName: value.firstName,
              lastName: value.lastName,
              phoneNumber: Number(value.phoneNumber),
              email: value.email,
              username: value.username,
              password: value.password,
            }),
          );
          // El registro no inicia sesión: el backend no emite tokens. Llevamos al login con un
          // indicador para mostrar un mensaje de éxito.
          await this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        } catch (error) {
          this.serverError.set(toUserMessage(error));
        }
        return undefined;
      },
    });
  }

  /** Muestra el error de un campo solo cuando fue tocado o ya se intentó enviar. */
  protected showError(field: FieldTree<string>): boolean {
    const state = field();
    return state.invalid() && (state.touched() || this.submitted());
  }
}
