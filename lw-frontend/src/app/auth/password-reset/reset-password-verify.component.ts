import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PasswordResetService } from '../../services/password-reset.service';
import { PW_RESET_EMAIL_KEY, PW_RESET_TOKEN_KEY, clearPasswordResetSession } from './password-reset.storage';

@Component({
  selector: 'app-reset-password-verify',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reset-password-verify.component.html',
})
export class ResetPasswordVerifyComponent implements OnInit {
  private passwordReset = inject(PasswordResetService);
  private router = inject(Router);

  email = '';
  submitting = false;
  resending = false;
  errorMessage = '';

  form = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
  });

  ngOnInit(): void {
    this.email = sessionStorage.getItem(PW_RESET_EMAIL_KEY) ?? '';
    if (!this.email) {
      void this.router.navigate(['/reset-password']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.email) {
      return;
    }

    const code = (this.form.value.code ?? '').trim();
    this.submitting = true;
    this.errorMessage = '';

    this.passwordReset.verifyCode(this.email, code).subscribe({
      next: (res) => {
        sessionStorage.setItem(PW_RESET_TOKEN_KEY, res.reset_token);
        this.submitting = false;
        void this.router.navigate(['/reset-password/new']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage = err?.error?.message ?? 'Could not verify code.';
        this.submitting = false;
      },
    });
  }

  resendCode(): void {
    if (!this.email || this.resending) {
      return;
    }
    this.resending = true;
    this.errorMessage = '';
    this.passwordReset.sendCode(this.email).subscribe({
      next: () => {
        this.resending = false;
      },
      error: () => {
        this.errorMessage = 'Could not resend code. Try again.';
        this.resending = false;
      },
    });
  }

  cancel(): void {
    clearPasswordResetSession();
    void this.router.navigate(['/reset-password']);
  }
}
