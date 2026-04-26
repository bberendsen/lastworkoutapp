import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthApiService } from './auth-api.service';

const TOKEN_KEY = 'lw_access_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  public readonly isLoggedInSignal = computed(() => this.token() !== null);

  public getToken(): string | null {
    return this.token();
  }

  public setToken(token: string): void {
    this.token.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  public clearToken(): void {
    this.token.set(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return this.isLoggedInSignal();
  }

  /** Calls backend to revoke the token, then clears local state. */
  public logout(): Observable<unknown> {
    if (!this.getToken()) {
      return of(null);
    }
    return this.authApi.logout().pipe(
      tap(() => this.clearToken()),
      catchError(() => {
        this.clearToken();
        return of(null);
      })
    );
  }
}
