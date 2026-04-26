import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './authService';

@Injectable({
  providedIn: 'root',
})
export class LoginStateService {
  private readonly authApi = inject(AuthApiService);
  private readonly auth = inject(AuthService);

  private readonly _submitting = signal(false);
  private readonly _submitted = signal(false);
  private readonly _error = signal<string | null>(null);

  public readonly submitting = this._submitting.asReadonly();
  public readonly submitted = this._submitted.asReadonly();
  public readonly error = this._error.asReadonly();

  public async login(username: string, password: string): Promise<string | null> {
    this._submitting.set(true);
    this._submitted.set(false);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.authApi.login(username, password));
      if (!response?.access_token) {
        throw new Error('No token in response');
      }

      this.auth.setToken(response.access_token);
      if (response.user?.id) {
        localStorage.setItem('userId', response.user.id);
      }
      this._submitted.set(true);

      return response.user?.id ?? null;
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message ?? 'Invalid credentials';
      this._error.set(message);
      return null;
    } finally {
      this._submitting.set(false);
    }
  }
}
