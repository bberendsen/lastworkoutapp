import { Injectable } from '@angular/core';
import { Health } from '@capgo/capacitor-health';
import { WorkoutService } from './workoutService';
import { Capacitor } from '@capacitor/core';

const LAST_SYNC_KEY = 'healthkit_last_sync_date';

// Using the Workout type from the plugin

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private isAuthorized = false;

  constructor(
    private workoutService: WorkoutService
  ) {}

  /**
   * Check if HealthKit is available (iOS only)
   */
  isAvailable(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  /**
   * Request authorization to read workouts from HealthKit
   * Note: Workouts don't require explicit authorization in the read array,
   * but we request basic permissions to ensure HealthKit access is granted
   */
  async requestAuthorization(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('HealthKit not available on this platform');
      return false;
    }

    try {
      // Request authorization for basic health data (workouts are queried separately)
      const result = await Health.requestAuthorization({
        read: ['steps'], // Minimal permission request
      });
      // If any read permissions are granted, we can query workouts
      this.isAuthorized = result.readAuthorized.length > 0;
      console.log('HealthKit authorization:', this.isAuthorized ? 'granted' : 'denied');
      return this.isAuthorized;
    } catch (error) {
      console.error('Error requesting HealthKit authorization:', error);
      return false;
    }
  }

  /**
   * Sync workouts from HealthKit to backend
   * Reads workouts since last sync (or last 7 days if first sync)
   */
  async syncWorkouts(userId: string): Promise<{ synced: number; skipped: number }> {
    if (!this.isAvailable() || !this.isAuthorized) {
      console.log('HealthKit not available or not authorized');
      return { synced: 0, skipped: 0 };
    }

    try {
      // Get last sync date or default to 7 days ago
      const lastSyncDate = this.getLastSyncDate();
      const startDate = new Date(lastSyncDate);
      const endDate = new Date();

      console.log(`Syncing HealthKit workouts from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Query workouts from HealthKit
      const result = await Health.queryWorkouts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100, // Adjust if needed
      });

      const workouts = result.workouts;
      console.log(`Found ${workouts.length} workouts in HealthKit`);

      let synced = 0;
      let skipped = 0;

      // Process each workout
      for (const workout of workouts) {
        try {
          // Use start date as the workout datetime
          const workoutDate = new Date(workout.startDate);
          
          // Skip if this workout is before our last sync (to avoid duplicates)
          if (workoutDate < startDate) {
            skipped++;
            continue;
          }

          // Log workout to backend
          await this.workoutService.logWorkout(
            userId,
            'apple_health',
            workoutDate.toISOString()
          ).toPromise();

          synced++;
          console.log(`Synced workout from ${workoutDate.toISOString()}`);
        } catch (error: any) {
          // If error is 422 (already logged today), skip it
          if (error?.status === 422) {
            skipped++;
            console.log(`Skipped workout (already logged): ${workout.startDate}`);
          } else {
            console.error('Error syncing workout:', error);
            skipped++;
          }
        }
      }

      // Update last sync date
      this.setLastSyncDate(endDate);

      console.log(`HealthKit sync complete: ${synced} synced, ${skipped} skipped`);
      return { synced, skipped };
    } catch (error) {
      console.error('Error syncing HealthKit workouts:', error);
      return { synced: 0, skipped: 0 };
    }
  }

  /**
   * Initialize HealthKit sync:
   * 1. Request authorization if not already granted
   * 2. Sync workouts if authorized
   */
  async initializeSync(userId: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    // Request authorization if not already authorized
    if (!this.isAuthorized) {
      const authorized = await this.requestAuthorization();
      if (!authorized) {
        console.log('HealthKit authorization denied, skipping sync');
        return;
      }
    }

    // Sync workouts
    await this.syncWorkouts(userId);
  }

  /**
   * Get the last sync date from localStorage
   */
  private getLastSyncDate(): Date {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      return new Date(stored);
    }
    // Default to 7 days ago for first sync
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }

  /**
   * Store the last sync date in localStorage
   */
  private setLastSyncDate(date: Date): void {
    localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
  }

  /**
   * Reset last sync date (useful for testing or forcing full resync)
   */
  resetLastSyncDate(): void {
    localStorage.removeItem(LAST_SYNC_KEY);
  }
}
