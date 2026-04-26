import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OnboardingStateService } from '../services/onboarding-state.service';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly onboardingState = inject(OnboardingStateService);

  public readonly form: FormGroup = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    birthdate: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  public readonly formSubmitting = this.onboardingState.submitting;
  public readonly formSubmitted = this.onboardingState.submitted;
  public readonly formSubmissionError = this.onboardingState.submissionError;
  public readonly user = this.onboardingState.user;

  private resetInputFocusBeforeRedirect(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  public async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const first_name = this.form.controls.first_name.value ?? '';
    const last_name = this.form.controls.last_name.value ?? '';
    const birthdate = this.form.controls.birthdate.value ?? '';
    const username = this.form.controls.username.value ?? '';
    const email = this.form.controls.email.value ?? '';
    const password = this.form.controls.password.value ?? '';

    const userId = await this.onboardingState.createAccountAndLogin({
      first_name,
      last_name,
      birthdate,
      username,
      email,
      password,
    });

    if (userId !== null) {
      this.resetInputFocusBeforeRedirect();
      setTimeout(() => {
        this.router.navigate(['/onboarding/team'], {
          state: { userId },
        });
      }, 500);
    }
  }
}