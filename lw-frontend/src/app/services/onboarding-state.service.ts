import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './authService';
import { CreateUserRequest, OnboardingApiService, OnboardingUserPayload } from './onboarding-api.service';

@Injectable({
  providedIn: 'root',
})
export class OnboardingStateService {
  private readonly onboardingApi = inject(OnboardingApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly auth = inject(AuthService);

  private readonly _submitting = signal(false);
  private readonly _submitted = signal(false);
  private readonly _submissionError = signal(false);
  private readonly _user = signal<OnboardingUserPayload | undefined>(undefined);

  public readonly submitting = this._submitting.asReadonly();
  public readonly submitted = this._submitted.asReadonly();
  public readonly submissionError = this._submissionError.asReadonly();
  public readonly user = this._user.asReadonly();

  public async createAccountAndLogin(payload: CreateUserRequest): Promise<string | null> {
    this._submitting.set(true);
    this._submitted.set(false);
    this._submissionError.set(false);

    try {
      const user = await firstValueFrom(this.onboardingApi.createUser(payload));
      if (!user?.id) {
        throw new Error('No user ID in response');
      }

      this._user.set(user);
      this._submitted.set(true);

      const loginResponse = await firstValueFrom(this.authApi.login(payload.username, payload.password));
      if (!loginResponse?.access_token) {
        throw new Error('Login failed: no token received');
      }

      this.auth.setToken(loginResponse.access_token);
      if (loginResponse.user?.id) {
        localStorage.setItem('userId', loginResponse.user.id);
      }

      return user.id;
    } catch {
      this._submissionError.set(true);
      return null;
    } finally {
      this._submitting.set(false);
    }
  }
}
