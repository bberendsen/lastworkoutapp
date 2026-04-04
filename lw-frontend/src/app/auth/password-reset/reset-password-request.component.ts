import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordResetService } from '../../services/password-reset.service';
import { PW_RESET_EMAIL_KEY, clearPasswordResetSession } from './password-reset.storage';

@Component({
  selector: 'app-reset-password-request',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reset-password-request.component.html',
})
export class ResetPasswordRequestComponent {
  private passwordReset = inject(PasswordResetService);
  private router = inject(Router);

  submitting = false;
  errorMessage = '';

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    clearPasswordResetSession();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const email = (this.form.value.email ?? '').trim();
    this.submitting = true;
    this.errorMessage = '';

    this.passwordReset.sendCode(email).subscribe({
      next: () => {
        sessionStorage.setItem(PW_RESET_EMAIL_KEY, email);
        this.submitting = false;
        void this.router.navigate(['/reset-password/verify']);
      },
      error: () => {
        this.errorMessage = 'Something went wrong. Please try again.';
        this.submitting = false;
      },
    });
  }
}
