import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { APP_ENDPOINTS } from '../config/app-endpoints';

const TOKEN_KEY = 'lw_access_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = APP_ENDPOINTS.apiBase;

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Calls backend to revoke the token, then clears local state. */
  logout(): Observable<unknown> {
    if (!this.getToken()) {
      return of(null);
    }
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearToken()),
      catchError(() => {
        this.clearToken();
        return of(null);
      })
    );
  }
}
