import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/authService';

export interface User {
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

interface LoginResponse {
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

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  private router = inject(Router);
  private http: HttpClient = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://127.0.0.1:8000/api/users';
  private loginUrl = 'http://127.0.0.1:8000/api/login';

  public formSubmitting: WritableSignal<boolean> = signal(false);
  public formSubmitted: WritableSignal<boolean> = signal(false);
  public formSubmissionError: WritableSignal<boolean> = signal(false);

  public user: WritableSignal<User | undefined> = signal(undefined);

  form: FormGroup = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    birthdate: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.formSubmitting.set(true);
    this.formSubmitted.set(false);
    this.formSubmissionError.set(false);

    try {
      const response = await this.http.post<User>(this.apiUrl, this.form.value).toPromise();
      
      if (response && response.id) {
        this.user.set(response);
        this.formSubmitted.set(true);

        // Log in to get token and store it
        const loginResponse = await this.http
          .post<LoginResponse>(this.loginUrl, {
            username: this.form.value.username,
            password: this.form.value.password,
          })
          .toPromise();

        if (!loginResponse?.access_token) {
          throw new Error('Login failed: no token received');
        }

        this.auth.setToken(loginResponse.access_token);
        if (loginResponse.user?.id) {
          localStorage.setItem('userId', loginResponse.user.id);
        }
        
        // Navigate to goal screen to set weekly goal
        setTimeout(() => {
          this.router.navigate(['/onboarding/goal'], { 
            state: { userId: response.id } 
          });
        }, 500);
      } else {
        throw new Error('No user ID in response');
      }
    } catch {
      this.formSubmissionError.set(true);
    } finally {
      this.formSubmitting.set(false);
    }
  }
}