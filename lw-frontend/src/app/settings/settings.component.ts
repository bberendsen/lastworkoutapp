import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../components/modal/modal.component';
import { AuthService } from '../services/authService';
import { HealthService } from '../services/healthService';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, CommonModule, ModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private healthService = inject(HealthService);

  showPrivacyModal = false;
  showTermsModal = false;
  healthSyncing = signal(false);
  healthMessage = signal<string | null>(null);

  get isHealthAvailable(): boolean {
    return this.healthService.isAvailable();
  }

  async syncAppleHealth(): Promise<void> {
    if (!this.isHealthAvailable) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.healthSyncing.set(true);
    this.healthMessage.set(null);

    try {
      await this.healthService.initializeSync(userId);
      this.healthMessage.set('Apple Health synced.');
      setTimeout(() => this.healthMessage.set(null), 3000);
    } catch (e) {
      this.healthMessage.set('Sync failed. Try again.');
    } finally {
      this.healthSyncing.set(false);
    }
  }

  openPrivacy(): void {
    this.showPrivacyModal = true;
  }

  closePrivacy(): void {
    this.showPrivacyModal = false;
  }

  openTerms(): void {
    this.showTermsModal = true;
  }

  closeTerms(): void {
    this.showTermsModal = false;
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => {
        localStorage.removeItem('userId');
        this.router.navigate(['/login']);
      }
    });
  }
}
