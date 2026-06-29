import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly authorities = this.auth.authorities;

  protected readonly canReadUsers = computed(() => this.auth.hasAuthority('user:read'));
  protected readonly canReadRoles = computed(() => this.auth.hasAuthority('role:read'));
  protected readonly canReadPermissions = computed(() => this.auth.hasAuthority('permission:read'));
}
