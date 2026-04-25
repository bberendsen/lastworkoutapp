import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { WorkoutService } from '../services/workoutService';
import type { Workout } from '../services/workoutService';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardWithStreak, StreakService } from '../services/streakService';
import { CelebrationOverlayComponent, CelebrationType } from '../components/celebration-overlay/celebration-overlay.component';
import { teamPresetLinearGradient } from '../teams/team.models';
import type { TeamLeaderboardRow } from '../teams/team.models';
import { HomescreenStateService } from '../services/homescreen-state.service';

interface TimeSinceLastWorkoutDisplay {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasWorkout: boolean;
}

type LeaderboardTab = 'users' | 'teams';
type HomescreenTab = 'home' | 'notifications';
interface DisplayUserLeaderboardRow {
  row: LeaderboardWithStreak;
  rank: number;
  isCurrentUser: boolean;
}

interface DisplayTeamLeaderboardRow {
  row: TeamLeaderboardRow;
  rank: number;
  isCurrentTeam: boolean;
}

interface HomescreenNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: Date | null;
  actionUrl: string | null;
  actionPath: string | null;
  actionTab: string | null;
}
@Component({
  standalone: true,
  selector: 'app-homescreen',
  templateUrl: './homescreen-component.html',
  imports: [RouterModule, CommonModule, FormsModule, CelebrationOverlayComponent],
  styleUrls: ['./homescreen-component.css']
})
export class HomescreenComponent implements OnInit, OnDestroy {
  private readonly weeklyXpNotificationTypes = new Set(['user_xp_up', 'user_xp_down', 'team_xp_up', 'team_xp_down']);
  private state = inject(HomescreenStateService);
  workouts = this.state.workouts;
  leaderboard = this.state.leaderboard;
  currentStreak = this.state.currentStreak;
  longestStreak = this.state.longestStreak;
  weeklyProgress = this.state.weeklyProgress;
  userId: string = '';
  loading = this.state.loading;
  error = this.state.error;
  workoutLoggedSuccessfully = signal(false);
  workoutLoggedFailed = signal(false);
  workoutLoggedErrorMsg = signal('');
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
  readonly presetGradient = teamPresetLinearGradient;
  myTeam = this.state.myTeam;
  teamsLeaderboard = this.state.teamsLeaderboard;
  teamsLoading = this.state.teamsLoading;
  teamsError = this.state.teamsError;
  activeLeaderboardTab = signal<LeaderboardTab>('users');
  activeTab = signal<HomescreenTab>('home');
  liveFeedPreview = this.state.liveFeedPreview;
  notificationsApi = this.state.notificationsApi;
  notificationsLoading = this.state.notificationsLoading;
  notificationUnreadCount = this.state.notificationUnreadCount;
  dismissingNotificationIds = signal<Record<string, boolean>>({});
  markingReadNotificationIds = signal<Record<string, boolean>>({});
  totalWorkouts = computed(() => this.workouts().length);
  userLeaderboardRow = computed(() => this.leaderboard().find((row) => row.id === this.userId) ?? null);
  userRank = computed(() => {
    if (!this.userId) return null;
    const idx = this.leaderboard().findIndex((row) => row.id === this.userId);
    return idx >= 0 ? idx + 1 : null;
  });
  myTeamLeaderboardRow = computed(() => {
    const team = this.myTeam();
    if (!team) return null;
    return this.teamsLeaderboard().find((row) => row.id === team.id) ?? null;
  });
  myTeamRank = this.state.myTeamRank;
  displayedUserLeaderboard = computed<DisplayUserLeaderboardRow[]>(() => {
    const rows = this.leaderboard();
    const topRows = rows.slice(0, 6).map((row, index) => ({
      row,
      rank: index + 1,
      isCurrentUser: row.id === this.userId,
    }));

    const hasCurrentUserVisible = topRows.some((entry) => entry.isCurrentUser);
    if (hasCurrentUserVisible || !this.userId) return topRows;

    const userIndex = rows.findIndex((row) => row.id === this.userId);
    if (userIndex === -1) return topRows;

    return [
      ...topRows,
      {
        row: rows[userIndex],
        rank: userIndex + 1,
        isCurrentUser: true,
      },
    ];
  });
  displayedTeamsLeaderboard = computed<DisplayTeamLeaderboardRow[]>(() => {
    const rows = this.teamsLeaderboard();
    const myTeamId = this.myTeam()?.id ?? null;
    const topRows = rows.slice(0, 6).map((row, index) => ({
      row,
      rank: index + 1,
      isCurrentTeam: myTeamId === row.id,
    }));

    if (!myTeamId || topRows.some((entry) => entry.isCurrentTeam)) return topRows;

    const teamIndex = rows.findIndex((row) => row.id === myTeamId);
    if (teamIndex === -1) return topRows;

    return [
      ...topRows,
      {
        row: rows[teamIndex],
        rank: teamIndex + 1,
        isCurrentTeam: true,
      },
    ];
  });
  notifications = computed<HomescreenNotification[]>(() =>
    this.notificationsApi()
      .filter((item) => {
        if (!this.weeklyXpNotificationTypes.has(item.type)) {
          return true;
        }
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        const hour = now.getHours();
        return day === 0 && hour >= 18;
      })
      .map((item) => {
      const actionUrl = item.action_url;
      const [pathPart, queryPart] = actionUrl ? actionUrl.split('?') : [null, null];
      const tab = queryPart?.startsWith('tab=') ? queryPart.replace('tab=', '') : null;
      return {
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        createdAt: item.event_datetime ? new Date(item.event_datetime) : null,
        actionUrl,
        actionPath: pathPart,
        actionTab: tab,
      };
      })
  );

  constructor(
    private workoutService: WorkoutService,
    private streakService: StreakService
  ) {
    effect(() => {
      this.setLastWorkoutTime(this.workouts());
    });
  }
  
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



    if (this.userId) {
      localStorage.setItem('userId', this.userId);
      this.state.ensureInitialized(this.userId);
    } else {
      this.error.set('No user ID found. Please create an account first.');
      this.loading.set(false);
    }
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
      next: () => {
        this.state.refreshAfterWorkout();
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

  setLeaderboardTab(tab: LeaderboardTab): void {
    this.activeLeaderboardTab.set(tab);
  }

  setActiveTab(tab: HomescreenTab): void {
    this.activeTab.set(tab);
  }

  dismissNotification(notificationId: string): void {
    this.dismissingNotificationIds.update((curr) => ({ ...curr, [notificationId]: true }));
    this.state.dismissNotification(notificationId).subscribe({
      next: () => {
        this.dismissingNotificationIds.update((curr) => {
          const next = { ...curr };
          delete next[notificationId];
          return next;
        });
      },
      error: () => {
        this.dismissingNotificationIds.update((curr) => {
          const next = { ...curr };
          delete next[notificationId];
          return next;
        });
      },
    });
  }

  markNotificationRead(notificationId: string): void {
    const notification = this.notificationsApi().find((item) => item.id === notificationId);
    if (!notification || !notification.is_unread) return;
    this.markingReadNotificationIds.update((curr) => ({ ...curr, [notificationId]: true }));
    this.state.markNotificationRead(notificationId).subscribe({
      next: () => {
        this.markingReadNotificationIds.update((curr) => {
          const next = { ...curr };
          delete next[notificationId];
          return next;
        });
      },
      error: () => {
        this.markingReadNotificationIds.update((curr) => {
          const next = { ...curr };
          delete next[notificationId];
          return next;
        });
      },
    });
  }

  isNotificationUnread(notificationId: string): boolean {
    return this.notificationsApi().some((item) => item.id === notificationId && item.is_unread);
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