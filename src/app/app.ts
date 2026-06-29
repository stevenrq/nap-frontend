import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly currentUser = this.auth.currentUser;

  protected readonly canReadUsers = computed(() => this.auth.hasAuthority('user:read'));
  protected readonly canReadRoles = computed(() => this.auth.hasAuthority('role:read'));
  protected readonly canReadPermissions = computed(() => this.auth.hasAuthority('permission:read'));

  protected logout(): void {
    this.auth.logout();
  }
}
