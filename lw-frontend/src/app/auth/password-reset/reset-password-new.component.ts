import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/authService';
import { PasswordResetService } from '../../services/password-reset.service';
import { PW_RESET_EMAIL_KEY, PW_RESET_TOKEN_KEY, clearPasswordResetSession } from './password-reset.storage';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('passwordConfirm')?.value;
  if (password && confirm && password !== confirm) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password-new',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reset-password-new.component.html',
})
export class ResetPasswordNewComponent implements OnInit {
  private passwordReset = inject(PasswordResetService);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  resetToken = '';
  submitting = false;
  errorMessage = '';
  success = false;

  form = new FormGroup(
    {
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      passwordConfirm: new FormControl('', [Validators.required]),
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    this.email = sessionStorage.getItem(PW_RESET_EMAIL_KEY) ?? '';
    this.resetToken = sessionStorage.getItem(PW_RESET_TOKEN_KEY) ?? '';
    if (!this.email || !this.resetToken) {
      void this.router.navigate(['/reset-password']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.email || !this.resetToken) {
      return;
    }

    const password = this.form.value.password ?? '';
    const passwordConfirm = this.form.value.passwordConfirm ?? '';

    this.submitting = true;
    this.errorMessage = '';

    this.passwordReset.resetPassword(this.email, this.resetToken, password, passwordConfirm).subscribe({
      next: (res) => {
        clearPasswordResetSession();
        this.auth.setToken(res.access_token);
        if (res.user?.id) {
          localStorage.setItem('userId', res.user.id);
        }
        this.success = true;
        this.submitting = false;
        setTimeout(() => {
          void this.router.navigate(['/homescreen'], { state: { userId: res.user?.id } });
        }, 400);
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage = err?.error?.message ?? 'Could not reset password.';
        this.submitting = false;
      },
    });
  }
}
