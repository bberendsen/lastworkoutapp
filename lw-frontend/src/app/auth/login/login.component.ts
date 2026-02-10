import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/authService';

export interface LoginResponse {
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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  private apiUrl = 'http://127.0.0.1:8000/api/login';

  formSubmitting = false;
  formSubmitted = false;
  formError = false;
  errorMessage = '';

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.formSubmitting = true;
    this.formSubmitted = false;
    this.formError = false;
    this.errorMessage = '';

    try {
      const response = await this.http
        .post<LoginResponse>(this.apiUrl, this.form.value)
        .toPromise();

      if (response?.access_token) {
        this.auth.setToken(response.access_token);
        if (response.user?.id) {
          localStorage.setItem('userId', response.user.id);
        }
        this.formSubmitted = true;
        setTimeout(() => {
          this.router.navigate(['/homescreen'], {
            state: { userId: response.user?.id },
          });
        }, 500);
      } else {
        throw new Error('No token in response');
      }
    } catch (err: unknown) {
      this.formError = true;
      this.errorMessage = (err as { error?: { message?: string } })?.error?.message ?? 'Invalid credentials';
    } finally {
      this.formSubmitting = false;
    }
  }
}
