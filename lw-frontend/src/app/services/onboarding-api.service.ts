import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_ENDPOINTS } from '../config/app-endpoints';

export interface OnboardingUserPayload {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  email?: string;
  has_subscription: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  birthdate: string;
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  public createUser(payload: CreateUserRequest): Observable<OnboardingUserPayload> {
    return this.http.post<OnboardingUserPayload>(APP_ENDPOINTS.users.collection, payload);
  }
}
