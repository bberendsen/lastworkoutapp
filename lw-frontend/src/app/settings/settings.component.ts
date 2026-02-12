import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../components/modal/modal.component';
import { AuthService } from '../services/authService';

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

  showPrivacyModal = false;
  showTermsModal = false;

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
