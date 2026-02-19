import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HealthService } from '../../services/healthService';

@Component({
  selector: 'app-onboarding-health',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-health.component.html',
  styleUrl: './onboarding-health.component.css'
})
export class OnboardingHealthComponent {
  private router = inject(Router);
  private healthService = inject(HealthService);

  requesting = signal(false);
  permissionGranted = signal(false);
  error = signal<string | null>(null);
  userId = '';

  get isHealthAvailable(): boolean {
    return this.healthService.isAvailable();
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || history.state?.['userId'] || '';
    if (!this.userId) {
      this.router.navigate(['/login']);
    }
  }

  async allowAccess(): Promise<void> {
    if (!this.isHealthAvailable) return;

    this.requesting.set(true);
    this.error.set(null);

    try {
      const granted = await this.healthService.requestAuthorization();
      this.permissionGranted.set(granted);

      if (granted && this.userId) {
        // Run initial sync so workouts appear right away
        await this.healthService.syncWorkouts(this.userId);
      }
    } catch (e) {
      console.error('Health permission error:', e);
      this.error.set('Could not request access. You can enable it later in Settings.');
    } finally {
      this.requesting.set(false);
    }
  }

  continue(): void {
    this.router.navigate(['/homescreen'], { state: { userId: this.userId } });
  }
}
