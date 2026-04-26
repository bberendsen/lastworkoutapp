import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginStateService } from '../../services/login-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly loginState = inject(LoginStateService);

  public readonly form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  public readonly formSubmitting = this.loginState.submitting;
  public readonly formSubmitted = this.loginState.submitted;
  public readonly errorMessage = this.loginState.error;

  public async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const username = this.form.controls.username.value ?? '';
    const password = this.form.controls.password.value ?? '';
    const userId = await this.loginState.login(username, password);

    if (userId !== null) {
      setTimeout(() => {
        this.router.navigate(['/homescreen'], {
          state: { userId },
        });
      }, 500);
    }
  }
}
