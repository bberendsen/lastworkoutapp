import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Same shape as login API response (used after password reset). */
export interface PasswordResetLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private http = inject(HttpClient);
  private readonly base = 'https://lastworkoutapp.onrender.com/api/password';

  sendCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/send-code`, { email });
  }

  verifyCode(email: string, code: string): Observable<{ reset_token: string }> {
    return this.http.post<{ reset_token: string }>(`${this.base}/verify-code`, { email, code });
  }

  resetPassword(
    email: string,
    resetToken: string,
    password: string,
    passwordConfirmation: string
  ): Observable<PasswordResetLoginResponse> {
    return this.http.post<PasswordResetLoginResponse>(`${this.base}/reset`, {
      email,
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    });
  }
}
