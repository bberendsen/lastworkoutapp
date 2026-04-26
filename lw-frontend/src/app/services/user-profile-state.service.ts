import { Injectable, inject, signal } from '@angular/core';
import { UserService, type UserProfilePayload } from './userService';

@Injectable({
  providedIn: 'root',
})
export class UserProfileStateService {
  private readonly userApi = inject(UserService);

  private readonly _data = signal<UserProfilePayload | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  public readonly data = this._data.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  public loadProfile(userId: string): void {
    this._loading.set(true);
    this._error.set(null);
    this.userApi.getUserProfile(userId).subscribe({
      next: (payload) => {
        this._data.set(payload);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Could not load this profile.');
        this._loading.set(false);
      },
    });
  }
}
