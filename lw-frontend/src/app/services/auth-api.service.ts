import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_ENDPOINTS } from '../config/app-endpoints';

export interface AuthUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface LoginApiResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = APP_ENDPOINTS.auth.login;
  private readonly logoutUrl = APP_ENDPOINTS.auth.logout;

  public login(username: string, password: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(this.loginUrl, { username, password });
  }

  public logout(): Observable<unknown> {
    return this.http.post(this.logoutUrl, {});
  }
}
