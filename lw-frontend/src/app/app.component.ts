import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';
import { HealthService } from './services/healthService';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, TabBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private healthService = inject(HealthService);
  private hideLogoutRoutes = ['/login', '/onboarding', '/onboarding/goal', '/onboarding/health'];
  private tabBarRoutes = ['/homescreen', '/leaderboard', '/statistics', '/settings'];
  showLogout = signal(true);
  showTabBar = signal(false);
  showSplash = signal(true);
  splashHiding = signal(false);
  private appStateListener: any;

  ngOnInit(): void {
    setTimeout(() => {
      this.splashHiding.set(true);
      setTimeout(() => this.showSplash.set(false), 400);
    }, 1800);

    // Initialize HealthKit sync on iOS when app becomes active
    if (Capacitor.getPlatform() === 'ios') {
      this.setupHealthKitSync();
    }
  }

  ngOnDestroy(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
  }

  private setupHealthKitSync(): void {
    // Sync when app becomes active (user opens app or switches back to it)
    this.appStateListener = App.addListener('appStateChange', async (state: { isActive: boolean }) => {
      if (state.isActive) {
        const userId = localStorage.getItem('userId');
        if (userId && this.healthService.isAvailable()) {
          // Small delay to ensure app is fully loaded
          setTimeout(() => {
            this.healthService.initializeSync(userId).catch(err => {
              console.error('Error initializing HealthKit sync:', err);
            });
          }, 1000);
        }
      }
    });

    // Also sync on initial load if user is logged in
    const userId = localStorage.getItem('userId');
    if (userId && this.healthService.isAvailable()) {
      setTimeout(() => {
        this.healthService.initializeSync(userId).catch(err => {
          console.error('Error initializing HealthKit sync:', err);
        });
      }, 3000); // Wait for splash screen to finish
    }
  }

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
}
