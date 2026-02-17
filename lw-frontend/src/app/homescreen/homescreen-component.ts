import { Component, computed, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Workout, WorkoutService } from '../services/workoutService';
import { UserService } from '../services/userService';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardWithStreak, StreakService } from '../services/streakService';
import { CelebrationOverlayComponent, CelebrationType } from '../components/celebration-overlay/celebration-overlay.component';
import { ModalComponent } from '../components/modal/modal.component';

interface TimeSinceLastWorkoutDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasWorkout: boolean;
}
@Component({
  standalone: true,
  selector: 'app-homescreen',
  templateUrl: './homescreen-component.html',
  imports: [RouterModule, CommonModule, FormsModule, CelebrationOverlayComponent, ModalComponent],
  styleUrls: ['./homescreen-component.css']
})
export class HomescreenComponent implements OnInit, OnDestroy {
  workouts: WritableSignal<Workout[]> = signal([]);
  leaderboard: WritableSignal<LeaderboardWithStreak[]> = signal([]);
  currentStreak: WritableSignal<number> = signal(0);
  longestStreak: WritableSignal<number> = signal(0);
  weeklyProgress: WritableSignal<{ workouts_this_week: number; goal: number } | null> = signal(null);
  showGoalEditor = signal(false);
  editingGoal = signal(3);
  userId: string = '';
  loading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);
  workoutLoggedSuccessfully: WritableSignal<boolean> = signal(false);
  workoutLoggedFailed: WritableSignal<boolean> = signal(false);
  workoutLoggedErrorMsg: WritableSignal<string> = signal('');
  celebrationType = signal<CelebrationType>('workout-logged');
  celebrationTitle = signal<string | undefined>(undefined);
  celebrationSubtitle = signal<string | undefined>(undefined);
  lastWorkoutTime = signal<Date | null>(null);
  hasLoggedToday = computed(() => {
    const list = this.workouts();
    if (!list || list.length === 0) return false;
    const latest = new Date(list[0].workout_datetime);
    const today = new Date();
    return latest.getFullYear() === today.getFullYear() &&
      latest.getMonth() === today.getMonth() &&
      latest.getDate() === today.getDate();
  });
  timeSinceLastWorkout = signal<TimeSinceLastWorkoutDisplay>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasWorkout: false,
  });
  private timerId: ReturnType<typeof setInterval> | null = null;
  private router = inject(Router);
  readonly Math = Math;
  
  constructor(
    private workoutService: WorkoutService,
    private streakService: StreakService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    // Get userId from navigation state (from onboarding) or browser history
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state && state['userId']) {
      this.userId = state['userId'];
    } else {
      // Fallback: check if there's a stored userId (e.g., from localStorage)
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = storedUserId;
      }
    }

    console.log('Homescreen loaded');
    console.log('User ID:', this.userId);

    if (this.userId) {
      this.loadWorkouts();
      this.loadCurrentStreak();
      // Store userId for future use
      localStorage.setItem('userId', this.userId);
    } else {
      this.error.set('No user ID found. Please create an account first.');
      this.loading.set(false);
    }

    this.loadLeaderboard();
    this.loadCurrentStreak();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  logWorkout(): void {
    if (!this.userId) {
      this.error.set('No user ID available. Please create an account first.');
      return;
    }

    this.workoutLoggedSuccessfully.set(false);
    this.workoutLoggedFailed.set(false);
    this.workoutLoggedErrorMsg.set('');
    this.workoutService.logWorkout(this.userId).subscribe({
      next: (response) => {
        this.loadWorkouts();
        this.loadLeaderboard();
        this.streakService.getCurrentStreak(this.userId).subscribe({
          next: (res) => {
            this.currentStreak.set(res.current_streak);
            this.longestStreak.set(res.longest_streak ?? 0);
            this.weeklyProgress.set(res.weekly_progress ? {
              workouts_this_week: res.weekly_progress.workouts_this_week,
              goal: res.weekly_progress.goal
            } : null);
            const { type, title, subtitle } = this.getCelebrationForStreak(res.current_streak);
            this.celebrationType.set(type);
            this.celebrationTitle.set(title);
            this.celebrationSubtitle.set(subtitle);
            this.workoutLoggedSuccessfully.set(true);
            this.workoutLoggedFailed.set(false);
            setTimeout(() => this.workoutLoggedSuccessfully.set(false), 2500);
          },
          error: () => {
            this.celebrationType.set('workout-logged');
            this.celebrationTitle.set(undefined);
            this.celebrationSubtitle.set(undefined);
            this.workoutLoggedSuccessfully.set(true);
            this.workoutLoggedFailed.set(false);
            setTimeout(() => this.workoutLoggedSuccessfully.set(false), 2500);
          }
        });
      },
      error: (error) => {
        console.error('Error logging workout:', error);
        this.workoutLoggedSuccessfully.set(false);
        this.workoutLoggedFailed.set(true);
        const msg = error?.error?.message;
        this.workoutLoggedErrorMsg.set(typeof msg === 'string' ? msg : 'Failed to log workout. Please try again.');
      }
    });
  }

  loadWorkouts(): void {
    if (!this.userId) {
      this.error.set('No user ID available. Cannot load workouts.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.workoutService.getWorkoutByUser(this.userId).subscribe({
      next: (workouts) => {
        this.workouts.set(workouts);
        this.loading.set(false);
        console.log('Workouts loaded:', workouts);
        this.setLastWorkoutTime(workouts);
      },
      error: (error) => {
        console.error('Error loading workouts:', error);
        this.error.set('Failed to load workouts');
        this.loading.set(false);
      }
    });
  }

  loadLeaderboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.streakService.getLeaderboardWithStreaks().subscribe({
      next: (leaderboard) => {
        this.leaderboard.set(leaderboard);
        console.log('Leaderboard loaded:', leaderboard);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.error.set('Failed to load leaderboard');
        this.loading.set(false);
      }
    });
  }

  loadCurrentStreak(): void {
    if (!this.userId) return;
    this.streakService.getCurrentStreak(this.userId).subscribe({
      next: (res) => {
        this.currentStreak.set(res.current_streak);
        this.longestStreak.set(res.longest_streak ?? 0);
        this.weeklyProgress.set(res.weekly_progress ? {
          workouts_this_week: res.weekly_progress.workouts_this_week,
          goal: res.weekly_progress.goal
        } : null);
      },
      error: () => {
        this.currentStreak.set(0);
        this.longestStreak.set(0);
        this.weeklyProgress.set(null);
      }
    });
  }

  openGoalEditor(): void {
    const wp = this.weeklyProgress();
    this.editingGoal.set(wp?.goal ?? 3);
    this.showGoalEditor.set(true);
  }

  closeGoalEditor(): void {
    this.showGoalEditor.set(false);
  }

  saveGoal(goal: number): void {
    if (!this.userId) return;
    this.userService.updateUser(this.userId, { weekly_goal: goal }).subscribe({
      next: () => {
        this.loadCurrentStreak();
        this.closeGoalEditor();
      }
    });
  }

  navigateToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  };

  private setLastWorkoutTime(workouts: Workout[]): void {
    if (!workouts || workouts.length === 0) {
      this.setNoWorkoutState();
      return;
    }

    let latestTime = 0;
    for (const workout of workouts) {
      const time = new Date(workout.workout_datetime).getTime();
      if (!Number.isNaN(time) && time > latestTime) {
        latestTime = time;
      }
    }

    if (latestTime === 0) {
      this.setNoWorkoutState();
      return;
    }

    this.lastWorkoutTime.set(new Date(latestTime));
    this.startTimer();
  }

  private startTimer(): void {
    this.clearTimer();
    this.updateTimeSinceLastWorkout();
    this.timerId = setInterval(() => {
      this.updateTimeSinceLastWorkout();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateTimeSinceLastWorkout(): void {
    const lastWorkout = this.lastWorkoutTime();
    if (!lastWorkout) {
      this.setNoWorkoutState();
      return;
    }

    const diffSeconds = Math.floor((Date.now() - lastWorkout.getTime()) / 1000);

    const safeDiff = Math.max(diffSeconds, 0);
    const days = Math.floor(safeDiff / 86400);
    const hours = Math.floor((safeDiff % 86400) / 3600);
    const minutes = Math.floor((safeDiff % 3600) / 60);
    const seconds = safeDiff % 60;

    this.timeSinceLastWorkout.set({
      days,
      hours,
      minutes,
      seconds,
      hasWorkout: true,
    });
  }

  private getCelebrationForStreak(streak: number): { type: CelebrationType; title?: string; subtitle?: string } {
    if (streak <= 1) {
      return { type: 'workout-logged' };
    }
    if (streak >= 30) {
      return { type: 'streak-30' };
    }
    if (streak >= 15) {
      return { type: 'streak-15' };
    }
    if (streak === 8) {
      return { type: 'streak-8' };
    }
    if (streak === 2) {
      return { type: 'streak' };
    }
    return {
      type: 'custom',
      title: `${streak} weeks in a row!`,
      subtitle: "You're on fire. Keep it up!",
    };
  }

  private setNoWorkoutState(): void {
    this.lastWorkoutTime.set(null);
    this.timeSinceLastWorkout.set({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      hasWorkout: false,
    });
    this.clearTimer();
  }
}