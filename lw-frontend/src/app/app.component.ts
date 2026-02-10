import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/authService';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, TabBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private hideLogoutRoutes = ['/login', '/onboarding'];
  private tabBarRoutes = ['/homescreen', '/leaderboard', '/statistics'];
  showLogout = signal(true);
  showTabBar = signal(false);

  constructor() {
    this.updateVisibility(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateVisibility(event.urlAfterRedirects);
      });
  }

  private updateVisibility(url: string): void {
    const path = url.split('?')[0];
    this.showLogout.set(!this.hideLogoutRoutes.includes(path));
    this.showTabBar.set(this.tabBarRoutes.includes(path));
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
