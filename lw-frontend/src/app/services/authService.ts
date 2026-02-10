import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

const TOKEN_KEY = 'lw_access_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

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
