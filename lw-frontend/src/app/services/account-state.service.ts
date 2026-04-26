import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authService';
import { UserService } from './userService';

@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  private readonly userApi = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _loading = signal(true);
  private readonly _saving = signal(false);
  private readonly _success = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _showDeleteModal = signal(false);
  private readonly _deleting = signal(false);
  private readonly _deleteError = signal<string | null>(null);
  private readonly _userId = signal('');

  public readonly loading = this._loading.asReadonly();
  public readonly saving = this._saving.asReadonly();
  public readonly success = this._success.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly showDeleteModal = this._showDeleteModal.asReadonly();
  public readonly deleting = this._deleting.asReadonly();
  public readonly deleteError = this._deleteError.asReadonly();
  public readonly userId = this._userId.asReadonly();

  public initialize(onLoaded: (data: { first_name: string; last_name: string; username: string }) => void): void {
    const stored = localStorage.getItem('userId');
    if (!stored) {
      void this.router.navigate(['/login']);
      return;
    }
    this._userId.set(stored);
    this.userApi.getUser(stored).subscribe({
      next: (user) => {
        onLoaded({
          first_name: user.first_name ?? '',
          last_name: user.last_name ?? '',
          username: user.username ?? '',
        });
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Could not load account.');
      },
    });
  }

  public save(payload: { first_name: string; last_name: string; username: string }): void {
    const id = this._userId();
    if (!id) return;
    this._saving.set(true);
    this._error.set(null);
    this.userApi.updateUser(id, payload).subscribe({
      next: () => {
        this._saving.set(false);
        this._success.set(true);
        setTimeout(() => this._success.set(false), 3000);
      },
      error: (err: { error?: { message?: string } }) => {
        this._saving.set(false);
        this._error.set(err?.error?.message ?? 'Could not update account.');
      },
    });
  }

  public openDeleteModal(): void {
    this._deleteError.set(null);
    this._showDeleteModal.set(true);
  }

  public closeDeleteModal(): void {
    if (this._deleting()) return;
    this._showDeleteModal.set(false);
    this._deleteError.set(null);
  }

  public confirmDeleteAccount(): void {
    const id = this._userId();
    if (!id || this._deleting()) return;
    this._deleting.set(true);
    this._deleteError.set(null);
    this.userApi.deleteUser(id).subscribe({
      next: () => {
        this.auth.clearToken();
        localStorage.removeItem('userId');
        void this.router.navigate(['/login']);
      },
      error: (err: { error?: { message?: string } }) => {
        this._deleting.set(false);
        this._deleteError.set(err?.error?.message ?? 'Could not delete account.');
      },
    });
  }
}
