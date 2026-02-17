import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/userService';

@Component({
  selector: 'app-onboarding-goal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-goal.component.html',
  styleUrl: './onboarding-goal.component.css'
})
export class OnboardingGoalComponent {
  private router = inject(Router);
  private userService = inject(UserService);

  saving = signal(false);
  error = signal<string | null>(null);
  userId = '';
  selectedGoal = 3;

  readonly goals = [1, 2, 3, 4, 5, 6, 7];

  ngOnInit(): void {
    const stored = localStorage.getItem('userId');
    const state = history.state;
    this.userId = state?.['userId'] || stored || '';
    if (!this.userId) {
      this.router.navigate(['/login']);
    }
  }

  selectGoal(n: number): void {
    this.selectedGoal = n;
  }

  continue(): void {
    if (!this.userId) return;
    this.saving.set(true);
    this.error.set(null);
    this.userService.updateUser(this.userId, { weekly_goal: this.selectedGoal }).subscribe({
      next: () => {
        this.router.navigate(['/homescreen'], { state: { userId: this.userId } });
      },
      error: () => {
        this.error.set('Could not save goal. Try again.');
        this.saving.set(false);
      }
    });
  }
}
