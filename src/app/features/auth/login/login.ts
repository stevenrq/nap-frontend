import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FieldTree,
  FormField,
  form,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';

import { AuthService } from '../../../core/auth/auth.service';
import { toUserMessage } from '../../../core/auth/http-error.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly model = signal({ username: '', password: '' });

  protected readonly form = form(this.model, (path) => {
    required(path.username, { message: 'El usuario es obligatorio.' });
    minLength(path.username, 5, { message: 'El usuario debe tener al menos 5 caracteres.' });
    maxLength(path.username, 20, { message: 'El usuario no puede superar 20 caracteres.' });
    required(path.password, { message: 'La contraseña es obligatoria.' });
    minLength(path.password, 5, { message: 'La contraseña debe tener al menos 5 caracteres.' });
  });

  protected readonly submitted = signal(false);
  protected readonly serverError = signal<string | null>(null);

  /** Mensaje de éxito tras registrarse (llegada desde /register con `?registered=true`). */
  protected readonly justRegistered = signal(
    this.route.snapshot.queryParamMap.get('registered') === 'true',
  );

  protected async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set(null);

    await submit(this.form, {
      action: async () => {
        try {
          await firstValueFrom(this.auth.login(this.model()));
          await this.router.navigateByUrl(this.returnUrl());
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

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
  }
}
